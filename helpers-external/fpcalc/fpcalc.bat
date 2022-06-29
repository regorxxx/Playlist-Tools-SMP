@ECHO OFF
REM Helper to execute fpcalc.exe (%3) on input (%1) and save output to file (%2)
REM Retrieves raw fingerprint as json
SET fpPath=%3
SET arch=x64
IF "%PROCESSOR_ARCHITECTURE%" == "x86" ( 
    IF NOT DEFINED PROCESSOR_ARCHITEW6432 (set arch=x86)
) 
IF "%arch%" == "x64" (
	%fpPath% -raw -json -length 240 %1>%2
) ELSE (
	%fpPath:.exe=_32.exe% -raw -json -length 240 %1>%2
)