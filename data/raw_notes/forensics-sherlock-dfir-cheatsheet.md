## GREP - Pattern Extraction

### IP Addresses

```bash
# Quick method
grep -Eo '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' file.log

# Strict method (0-255)
grep -Eo '\b(25[0-5]|2[0-4][0-9]|[^01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[^01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[^01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[^01]?[0-9][0-9]?)\b' file.log

# With CIDR
grep -Eo '([0-9]{1,3}\.){3}[0-9]{1,3}(/[0-9]{1,2})?' file.log | sort -u
```

### Emails, Domains, URLs, and Hashes

```bash
# Emails
grep -Eo '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' file.log

# Domains
grep -Eo '([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}' file.log | sort -u

# URLs
grep -Eo 'https?://[^"/ ]+[^ "]*' file.log

# MD5
grep -Eo '\b[a-fA-F0-9]{32}\b' file.log

# SHA1
grep -Eo '\b[a-fA-F0-9]{40}\b' file.log

# SHA256
grep -Eo '\b[a-fA-F0-9]{64}\b' file.log

# Base64
grep -Eo '[A-Za-z0-9+/]{20,}={0,2}' file.log
```

### Useful Windows Patterns

```bash
# Windows paths
grep -Eo '[A-Z]:\\[^"<>|?*\n]+' file.log

# Usernames
grep -Eo 'User(name)?:\s*\S+' file.log

# ISO timestamps
grep -Eo '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}' file.log

# Network ports
grep -Eo ':[0-9]{1,5}\b' file.log | sort -u

# Registry keys
grep -Eo 'HK(LM|CU|CR|U|CC)\\[^\s"]+' file.log
```

## Strings and File Analysis

### File Identification

```bash
file file.bin
xxd file.bin | head -20
hexdump -C file.bin | head
binwalk file.bin
exiftool file
```

### String Extraction

```bash
strings file.bin
strings -n 8 file.bin               # minimum 8 chars
strings -e l file.bin               # UTF-16LE (Windows)
strings -e b file.bin               # UTF-16BE
strings file.bin | grep -iE 'http|cmd|powershell|base64'
strings file.bin | grep -Eo '[A-Za-z0-9+/]{40,}={0,2}'  # base64
```

### Decode Base64 / XOR

```bash
echo "SGVsbG8=" | base64 -d
cat file.b64 | base64 -d > output.bin
python3 -c "import base64; print(base64.b64decode('SGVsbG8=').decode())"

# XOR brute force (Python)
python3 -c "
data = open('file.bin','rb').read()
for key in range(256):
    out = bytes([b ^ key for b in data])
    if b'flag' in out.lower() or b'http' in out.lower():
        print(f'Key {key}: {out[:100]}')
"
```

### Steganography

```bash
steghide extract -sf image.jpg
steghide info image.jpg
zsteg image.png                        # PNG/BMP lsb
stegsolve image.png                    # GUI analysis
foremost -i file.bin -o output/        # File carving
```

## Windows Event Logs (EVTX)

### Parsing with EvtxECmd (Zimmerman)

```bash
# Parse a single file
EvtxECmd.exe -f Security.evtx --csv . --csvf security_output.csv

# Parse an entire folder
EvtxECmd.exe -d C:\Logs\ --csv C:\Output\ --csvf all_events.csv

# Filter by Event ID
EvtxECmd.exe -f Security.evtx --csv . --inc 4624,4625,4648,4688
```

### Parsing with Python (evtx)

```bash
pip install python-evtx

# Dump XML
python3 -c "
import Evtx.Evtx as evtx
import Evtx.Views as e_views
with evtx.Evtx('Security.evtx') as log:
    for record in log.records():
        print(record.xml())
" | grep -E '4624|4625'
```

### PowerShell - Quick Analysis

```powershell
# Read events by ID
Get-WinEvent -Path Security.evtx | Where-Object {$_.Id -eq 4624} | Select TimeCreated, Message

# Export CSV
Get-WinEvent -Path Security.evtx | Where-Object {$_.Id -in @(4624,4625,4648)} |
  Select-Object TimeCreated, Id, Message | Export-Csv events.csv -NoTypeInformation

# Search by keyword
Get-WinEvent -Path Security.evtx | Where-Object {$_.Message -like "*powershell*"}

# Quick parsing with evtx_dump (Linux)
evtx_dump Security.evtx | grep -A5 "EventID>4688"
```

### Critical Event IDs to Monitor

```text
Event ID | Channel    | Description
4624     | Security   | Successful logon
4625     | Security   | Failed logon
4648     | Security   | Logon with explicit credentials (runas)
4672     | Security   | Admin privileges assigned
4688     | Security   | New process created
4698/4702| Security   | Scheduled task created/modified
4720     | Security   | User account created
4732     | Security   | Member added to local group
4756     | Security   | Member added to universal group
7045     | System     | New service installed
7036     | System     | Service started/stopped
4104     | PowerShell | ScriptBlock logging
4103     | PowerShell | Module logging
1116/1117| Defender   | Malware detected/cleaned
3        | Sysmon     | Network connection
11       | Sysmon     | File created
13       | Sysmon     | Registry value set
22       | Sysmon     | DNS Query
```

## Memory Forensics - Volatility 3

### Setup and Identification

```bash
vol3 -f mem.dmp windows.info          # OS info
vol3 -f mem.dmp banners               # Linux kernel banner
vol3 -f mem.dmp isfb                  # Detect ISFB/Gozi
```

### Processes

```bash
vol3 -f mem.dmp windows.pslist        # Process list
vol3 -f mem.dmp windows.pstree        # Process tree
vol3 -f mem.dmp windows.psscan        # Scan (detects DKOM rootkits)
vol3 -f mem.dmp windows.cmdline       # Command lines
vol3 -f mem.dmp windows.dlllist       # Loaded DLLs
vol3 -f mem.dmp windows.handles       # Open handles by PID
vol3 -f mem.dmp windows.handles --pid 1234
```

### Injection Detection

```bash
vol3 -f mem.dmp windows.malfind       # Suspicious memory regions (shellcode, injected PEs)
vol3 -f mem.dmp windows.hollowfind    # Process hollowing
vol3 -f mem.dmp windows.dlllist --pid 1234  # DLL injection
vol3 -f mem.dmp windows.vadinfo --pid 1234  # Virtual Address Descriptors
```

### Network

```bash
vol3 -f mem.dmp windows.netstat       # Active + closed connections
vol3 -f mem.dmp windows.netscan       # Full network scan
```

### Registry

```bash
vol3 -f mem.dmp windows.registry.hivelist   # Loaded hives
vol3 -f mem.dmp windows.registry.hivescan   # Scan hives (hidden)
vol3 -f mem.dmp windows.registry.printkey --key "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
vol3 -f mem.dmp windows.registry.userassist
```

### Files and Dumps

```bash
vol3 -f mem.dmp windows.filescan      # All files
vol3 -f mem.dmp windows.filescan | grep -i ".exe\|.dll\|.bat\|.ps1"
vol3 -f mem.dmp windows.dumpfiles --physaddr 0x...   # Dump file by address
vol3 -f mem.dmp windows.memmap --pid 1234 --dump     # Dump process memory

# Dump executable
vol3 -f mem.dmp windows.procdump --pid 1234
```

### Credentials

```bash
vol3 -f mem.dmp windows.hashdump     # NTLM hashes SAM
vol3 -f mem.dmp windows.lsadump      # LSA Secrets
vol3 -f mem.dmp windows.cachedump    # Cached credentials
```

### Services and Drivers

```bash
vol3 -f mem.dmp windows.svcscan      # Services (detects hidden services)
vol3 -f mem.dmp windows.driverscan   # Loaded drivers
vol3 -f mem.dmp windows.modules      # Kernel modules
vol3 -f mem.dmp windows.ssdt         # SSDT verification (hooking)
```

### Clipboard and Console

```bash
vol3 -f mem.dmp windows.clipboard    # Clipboard contents
vol3 -f mem.dmp windows.consoles     # Console history (cmd)
vol3 -f mem.dmp windows.cmdscan      # Command scan
```

## Network Analysis - tshark / Wireshark

### Quick Reading and Stats

```bash
capinfos file.pcap                    # General info
tshark -r file.pcap -q -z io,stat,0  # Global stats
tshark -r file.pcap -q -z conv,tcp   # TCP conversations
tshark -r file.pcap -q -z endpoints,ip  # IP endpoints
tshark -r file.pcap | wc -l          # Packet count
```

### Display Filters

```bash
# HTTP
tshark -r file.pcap -Y "http"
tshark -r file.pcap -Y "http.request.method == POST"
tshark -r file.pcap -Y "http" -T fields -e ip.src -e http.request.uri -e http.user_agent

# DNS
tshark -r file.pcap -Y "dns" -T fields -e dns.qry.name | sort -u

# FTP
tshark -r file.pcap -Y "ftp || ftp-data"

# SMB / NTLM
tshark -r file.pcap -Y "smb2" | grep -i "NTLMSSP"
tshark -r file.pcap -Y "ntlmssp"

# ICMP
tshark -r file.pcap -Y "icmp"

# Plaintext credentials
tshark -r file.pcap -Y "ftp.request.command == PASS || http.authorization"
```

### File Extraction

```bash
# HTTP objects
tshark -r file.pcap --export-object http,./output/

# SMB objects
tshark -r file.pcap --export-object smb,./output/

# TFTP
tshark -r file.pcap --export-object tftp,./output/

# With NetworkMiner
mono NetworkMiner.exe file.pcap
```

### Specific Field Extraction

```bash
# HTTP User-Agents
tshark -r file.pcap -Y http -T fields -e http.user_agent | sort | uniq -c | sort -rn

# DNS hostnames
tshark -r file.pcap -Y "dns.flags.response == 0" -T fields -e dns.qry.name | sort -u

# Source/destination IPs
tshark -r file.pcap -T fields -e ip.src -e ip.dst | sort | uniq -c | sort -rn

# Destination ports
tshark -r file.pcap -T fields -e tcp.dstport | sort | uniq -c | sort -rn

# Full TCP stream
tshark -r file.pcap -Y "tcp.stream eq 0" -z follow,tcp,ascii,0
```

### C2 / Malware Detection

```bash
# Long beaconing intervals
tshark -r file.pcap -Y "http" -T fields -e frame.time -e ip.dst -e http.host | sort

# Large suspicious transfers
tshark -r file.pcap -T fields -e ip.src -e ip.dst -e frame.len | sort -k3 -rn | head -20

# Suspicious TLS connections (without SNI)
tshark -r file.pcap -Y "tls.handshake.type == 1" -T fields -e ip.dst -e tls.handshake.extensions_server_name
```

## Windows Registry Forensics

### Parsing Tools

```bash
# RECmd (Zimmerman)
RECmd.exe -f NTUSER.DAT --csv . --csvf ntuser_output.csv
RECmd.exe -d C:\Registry\ --csv . --bn BatchExamples\Kroll_Batch.reb

# Python offline (python-registry)
pip install python-registry
python3 -c "
from Registry import Registry
reg = Registry.Registry('NTUSER.DAT')
key = reg.open('Software\\Microsoft\\Windows\\CurrentVersion\\Run')
for value in key.values():
    print(value.name(), value.value())
"
```

### Persistence Locations to Check

```text
# Autorun / Run keys
SOFTWARE\Microsoft\Windows\CurrentVersion\Run
SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce
NTUSER.DAT\Software\Microsoft\Windows\CurrentVersion\Run

# Services
SYSTEM\CurrentControlSet\Services\

# Scheduled Tasks (legacy)
SOFTWARE\Microsoft\Windows NT\CurrentVersion\Schedule\TaskCache\Tasks

# Browser extensions / COM hijack
SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Browser Helper Objects
```

### User Artifacts (NTUSER.DAT)

```text
# Recent files
NTUSER.DAT\Software\Microsoft\Windows\CurrentVersion\Explorer\RecentDocs

# Typed URLs (IE/Edge)
NTUSER.DAT\Software\Microsoft\Internet Explorer\TypedURLs

# UserAssist (launched programs - ROT13 encoded)
NTUSER.DAT\Software\Microsoft\Windows\CurrentVersion\Explorer\UserAssist\{GUID}\Count

# MRU (Most Recently Used)
NTUSER.DAT\Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU
NTUSER.DAT\Software\Microsoft\Office\16.0\Word\RecentFiles

# ShellBags (browsed folders)
NTUSER.DAT\Software\Microsoft\Windows\Shell\BagMRU
UsrClass.DAT\Local Settings\Software\Microsoft\Windows\Shell\BagMRU
```

### System Information (SYSTEM Hive)

```text
# Hostname
SYSTEM\CurrentControlSet\Control\ComputerName\ComputerName

# Timezone
SYSTEM\CurrentControlSet\Control\TimeZoneInformation

# Connected USB devices
SYSTEM\CurrentControlSet\Enum\USBSTOR

# Network shares
SYSTEM\CurrentControlSet\Services\LanmanServer\Shares

# Last shutdown
SYSTEM\CurrentControlSet\Control\Windows -> ShutdownTime
```

## Linux Forensics

### Quick Information Gathering

```bash
# System
uname -a && cat /etc/os-release
hostname && date
uptime && w

# Logged in users / login history
last -Faiw
lastlog
who -a
w

# Users with shell
cat /etc/passwd | grep -E '/bin/(bash|sh|zsh|fish)$'

# Accounts with UID 0
awk -F: '($3==0){print $1}' /etc/passwd
```

### Processes and Network

```bash
# Running processes
ps auxf
ps -eo pid,user,cmd --sort=-%mem | head -20

# Network connections
ss -tulnap
netstat -tulnap
lsof -i

# Processes by connection
ss -tulnap | grep -v LISTEN
lsof -i -n -P | grep ESTABLISHED
```

### Linux Persistence Mechanisms

```bash
# Crontabs
crontab -l
cat /etc/crontab
ls /etc/cron.*/
for user in $(cat /etc/passwd | cut -f1 -d:); do echo "$user:"; crontab -u $user -l 2>/dev/null; done

# Services
systemctl list-units --type=service --all
ls /etc/systemd/system/
ls /etc/init.d/

# Suspicious SUID binaries
find / -type f -perm -u=s 2>/dev/null
getcap -r / 2>/dev/null

# Modified .bashrc / .profile
find /home /root -name ".bashrc" -o -name ".profile" -o -name ".bash_profile" | xargs ls -la

# SSH authorized_keys
find / -name "authorized_keys" 2>/dev/null | xargs cat
```

### Suspicious Files

```bash
# Recently modified
find / -mtime -7 -type f 2>/dev/null | grep -v proc | grep -v sys
find /tmp /var/tmp /dev/shm -type f 2>/dev/null

# Hidden files
find / -name ".*" -type f 2>/dev/null | grep -v ".cache\|.config\|.local"

# Files with altered timestamps
stat /path/to/file
find / -newer /etc/passwd -type f 2>/dev/null

# Suspicious setuid binaries
find / -perm /4000 -type f 2>/dev/null | xargs ls -la
```

### Linux Logs

```bash
cat /var/log/auth.log | grep -E "Failed|Invalid|Accepted"
cat /var/log/syslog | grep -iE "error|cron|sudo"
cat /var/log/secure   # RHEL/CentOS
journalctl -xe
journalctl --since "2024-01-01" --until "2024-01-31"

# SSH connections
grep "Accepted\|Failed" /var/log/auth.log | awk '{print $1,$2,$3,$9,$11}' | sort | uniq -c | sort -rn

# Sudo usage
grep sudo /var/log/auth.log
```

## Zimmerman Tools (Windows)

### Eric Zimmerman Tools - Essentials

```text
Tool                   | Usage
EvtxECmd               | Parse .evtx files to CSV
MFTECmd                | Parse NTFS $MFT
PECmd                  | Analyze Prefetch .pf files
LECmd                  | Analyze LNK files
JLECmd                 | Jump Lists (recent activities)
RECmd                  | Registry hives to CSV
ShellBagsExplorer      | ShellBags GUI
Timeline Explorer      | Forensics CSV viewer
AppCompatCacheParser   | Shimcache (executed programs)
AmcacheParser          | Amcache.hve (installed programs)
```

### PECmd - Prefetch

```bash
# Parse all prefetch
PECmd.exe -d "C:\Windows\Prefetch" --csv . --csvf prefetch.csv

# Specific file
PECmd.exe -f POWERSHELL.EXE-XXXXXXXX.pf

# On Linux with wine
wine PECmd.exe -d ./Prefetch/ --csv . --csvf prefetch.csv
```

### MFTECmd - NTFS MFT

```bash
MFTECmd.exe -f '$MFT' --csv . --csvf mft_output.csv
MFTECmd.exe -f '$MFT' --csv . --de 0  # Specific entry
```

### AmcacheParser

```bash
AmcacheParser.exe -f Amcache.hve --csv . --csvf amcache.csv
```

### AppCompatCacheParser (Shimcache)

```bash
AppCompatCacheParser.exe -f SYSTEM --csv . --csvf shimcache.csv
```

## Malware Analysis / PE Files

### Identification and Static Information

```bash
file malware.exe
strings -n 8 malware.exe | grep -iE 'http|cmd|run|shell|inject|key|pass'
strings -e l malware.exe              # UTF-16LE

# PE info
exiftool malware.exe
pecheck malware.exe                   # pip install pefile
python3 -c "
import pefile
pe = pefile.PE('malware.exe')
print(pe.dump_info())
"

# Imports / Exports
python3 -c "
import pefile
pe = pefile.PE('malware.exe')
for entry in pe.DIRECTORY_ENTRY_IMPORT:
    print(entry.dll.decode())
    for imp in entry.imports:
        print('  ', imp.name)
"
```

### Hash and VirusTotal

```bash
md5sum malware.exe
sha256sum malware.exe
sha1sum malware.exe
```

### YARA Scanning

```bash
yara -r rules/ file.bin
yara -r /opt/yara-rules/ /malware/
yara rule.yar file.exe
```

### PowerShell Deobfuscation

```bash
# Decode base64 encoded PowerShell
echo "JABzAD0A..." | base64 -d | iconv -f utf-16le -t utf-8

# Python
python3 -c "
import base64
payload = 'JABzAD0A...'
decoded = base64.b64decode(payload).decode('utf-16-le')
print(decoded)
"

# Suspicious PowerShell keywords
grep -iE 'EncodedCommand|FromBase64|IEX|Invoke-Expression|DownloadString|Net.WebClient|bypass|hidden' file.ps1
```

## Timeline and Correlation

### Creating a Timeline with log2timeline (Plaso)

```bash
# Create timeline image
log2timeline.py plaso.dump /path/to/image/

# Specific filters
log2timeline.py --parsers winevtx,prefetch,mft plaso.dump /artifacts/

# Export CSV
psort.py -o l2tcsv -w timeline.csv plaso.dump

# Filter by date
psort.py -o l2tcsv -w output.csv plaso.dump "date > '2024-01-01 00:00:00' AND date < '2024-02-01 00:00:00'"
```

### Quick Correlation with awk/sort

```bash
# Combined timeline from logs
cat auth.log syslog | awk '{print $1,$2,$3,$0}' | sort -k1,3 | less

# Events around a timestamp
grep "Jan 15 14:" /var/log/auth.log

# Sort Windows events by timestamp
Get-WinEvent -Path *.evtx | Sort-Object TimeCreated | Select TimeCreated,Id,Message | Out-GridView
```

## Key Windows Artifacts

### Prefetch

```text
Location: C:\Windows\Prefetch\*.pf
Evidence: Program execution proof (even if deleted)
Timestamp: Last execution (+ 7 previous on Win8+)
```

### LNK Files

```text
Location: C:\Users\<user>\AppData\Roaming\Microsoft\Windows\Recent\
Evidence: Accessed files, mounted volumes, timestamps
```

### Jump Lists

```text
Location: C:\Users\<user>\AppData\Roaming\Microsoft\Windows\Recent\AutomaticDestinations\
Evidence: Applications and recent files
```

### Amcache / Shimcache

```text
Amcache:   C:\Windows\AppCompat\Programs\Amcache.hve (includes SHA1 hash)
Shimcache: SYSTEM hive -> CurrentControlSet\Control\Session Manager\AppCompatCache
Evidence: Execution proof even if file is deleted
```

### MFT / NTFS

```bash
# Extract MFT
mftdump -o mft_output.csv '$MFT'
MFTECmd.exe -f '$MFT' --csv .

# NTFS timestamps ($STANDARD_INFO vs $FILE_NAME)
# If $SI timestamps < $FN -> sign of timestomping
```

### Browser Artifacts

```bash
# Chrome history (SQLite)
sqlite3 "~/.config/google-chrome/Default/History" \
  "SELECT url, title, last_visit_time FROM urls ORDER BY last_visit_time DESC LIMIT 50;"

# Firefox
sqlite3 "~/.mozilla/firefox/xxx.default/places.sqlite" \
  "SELECT url, title, last_visit_date FROM moz_places ORDER BY last_visit_date DESC LIMIT 50;"
```

```text
# Windows paths:
# Chrome: %LOCALAPPDATA%\Google\Chrome\User Data\Default\History
# Firefox: %APPDATA%\Mozilla\Firefox\Profiles\xxx\places.sqlite
```

## Docker / Container Forensics

### Docker Image Analysis

```bash
# Inspect an image
docker inspect <image_id>
docker history <image_id>

# Explore layers
dive <image_name>

# Extract layers manually
docker save image:tag -o image.tar
tar xf image.tar
for layer in */layer.tar; do tar tf $layer; done

# Find modified files in a layer
tar xf layer.tar -C ./layer_extract/
find ./layer_extract/ -newer /tmp/ref_time -type f 2>/dev/null
```

## Quick Tools - One-Liners

### Common DFIR One-Liners

```bash
# Top IPs in a log
grep -Eo '([0-9]{1,3}\.){3}[0-9]{1,3}' access.log | sort | uniq -c | sort -rn | head -20

# Obfuscated PowerShell commands (Event 4104)
grep -i "encodedcommand\|iex\|downloadstring" powershell.log | sort -u

# Unique connections from pcap
tshark -r traffic.pcap -T fields -e ip.src -e ip.dst -e tcp.dstport | sort -u

# Files modified in the last 24 hours
find / -mtime -1 -type f 2>/dev/null | grep -v "/proc\|/sys\|/run"

# MD5 hashes of all files in a folder
find ./malware/ -type f -exec md5sum {} \; | sort

# Quickly decode UserAssist (ROT13)
echo "Zvpebfbsg.JvaqbjfCbjreRnss" | tr 'A-Za-z' 'N-ZA-Mn-za-m'

# Extract all PS1 scripts from evtx
evtx_dump PowerShell-Operational.evtx | grep -A2 "ScriptBlock" | grep "Text"

# Recursive grep across all logs
grep -rn "lateral\|mimikatz\|sekurlsa\|lsass" /var/log/ 2>/dev/null
```

### Recommended Sherlock Workflow

```text
1. Identify the provided artifacts
2. Read the questions to guide your investigation
3. Parse with appropriate tools (Zimmerman, Volatility, tshark)
4. Correlate timestamps across artifacts
5. Document each answer with the source command
```
