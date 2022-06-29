@ECHO OFF
REM Helper to execute ffmpeg.exe (%3) on input (%1) and save output to file (%2)
REM Retrieves LRA data as json
SET ffPath=%3
SET arch=x64
IF "%PROCESSOR_ARCHITECTURE%" == "x86" ( 
    IF NOT DEFINED PROCESSOR_ARCHITEW6432 (set arch=x86)
) 
IF "%arch%" == "x64" (
	%ffPath% -i %1 -af loudnorm=dual_mono=true:print_format=json -nostats -f null -  2>&1 | > %2 FINDSTR /BIR "{ .*\" }"
) ELSE (
	%ffPath:.exe=_32.exe% -i %1 -af loudnorm=dual_mono=true:print_format=json -nostats -f null -  2>&1 | > %2 FINDSTR /BIR "{ .*\" }"
)