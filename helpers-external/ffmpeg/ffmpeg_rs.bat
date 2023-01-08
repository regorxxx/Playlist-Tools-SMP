@ECHO OFF
REM Helper to execute ffmpeg.exe on input (%1) and show console
REM Retrieves LRA data as json
SET path=%~dp0
SET arch=x64
SET ffmpeg="%path%ffmpeg.exe"
SET sed="%path%sed.exe"
SET useSed=TRUE
IF "%PROCESSOR_ARCHITECTURE%" == "x86" ( 
	IF NOT DEFINED PROCESSOR_ARCHITEW6432 (SET arch=x86)
) 
IF "%arch%" == "x86" (
	SET ffmpeg="%path%ffmpeg_32.exe"
)
IF "%useSed%" == "TRUE" (
	ECHO Processing: %1
	ECHO.
	%ffmpeg% -i %1 -af loudnorm=dual_mono=true:print_format=json -nostats -f null - 2>&1 | %sed% 1,/^\[Parsed_loudnorm/d
) ELSE (
	%ffmpeg% -i %1 -af loudnorm=dual_mono=true:print_format=json -nostats -f null -
)
ECHO.
ECHO Copy 'input_lra' value into a tag named 'LRA' within foobar
PAUSE