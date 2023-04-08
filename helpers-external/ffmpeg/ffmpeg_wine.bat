@ECHO OFF
REM Helper to execute ffmpeg.exe (%3) on input (%1) and save output to file (%2)
REM Retrieves LRA data as json
SET ffPath=%3
SET arch=x64
SET sed=%ffPath:ffmpeg.exe=sed.exe%
SET useSed=TRUE
IF "%PROCESSOR_ARCHITECTURE%" == "x86" ( 
	IF NOT DEFINED PROCESSOR_ARCHITEW6432 (SET arch=x86)
) 
IF NOT "%arch%" == "x64" (
	SET temp=%ffPath:.exe=_32.exe%
	SET ffPath=%temp%
)
IF "%useSed%" == "TRUE" (
	%ffPath% -hide_banner -i %1 -af loudnorm=dual_mono=true:print_format=json -nostats -f null - >%2.temp 2>&1
	%sed% 1,/^\[Parsed_loudnorm/d %2.temp >%2 2>&1
) ELSE (
	%ffPath% -hide_banner -i %1 -af loudnorm=dual_mono=true:print_format=json -nostats -f null - >%2.temp 2>&1
	>%2  2>&1 FINDSTR /BIR "{ .*\" }" %2.temp
)
IF EXIST %2.temp DEL /Q %2.temp