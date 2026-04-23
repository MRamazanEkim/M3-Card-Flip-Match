[Setup]
AppName=M3 Kart
AppVersion=1.7
DefaultDirName={pf}\M3 Kart
ArchitecturesInstallIn64BitMode=x64
DefaultGroupName=M3 kart
UninstallDisplayIcon={app}\M3 Kart.exe
OutputDir="F:\Dev\A-Setuplar"
OutputBaseFilename=M3_Kart_Setup_V1.7
SetupIconFile=app_icon.ico
Compression=lzma
SolidCompression=yes

[Files]
Source: "dist\win-unpacked\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\M3 Kart"; Filename: "{app}\M3 Kart.exe"
Name: "{group}\Uninstall M3 Kart"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\M3_Kart.exe"; Description: "Launch M3 Kart"; Flags: nowait postinstall skipifsilent
