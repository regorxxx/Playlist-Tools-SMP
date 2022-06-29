@ECHO OFF
REM Helper to execute ffmpeg.exe on input (%1) and show console
REM Retrieves LRA data as json
set path=%~dp0
SET arch=x64
set ffmpeg="%path%ffmpeg.exe"
IF "%PROCESSOR_ARCHITECTURE%" == "x86" ( 
    IF NOT DEFINED PROCESSOR_ARCHITEW6432 (set arch=x86)
) 
IF "%arch%" == "x86" (
	set ffmpeg="%path%ffmpeg_32.exe"
)
%ffmpeg% -i %1 -af loudnorm=dual_mono=true:print_format=json -nostats -f null -
ECHO.
ECHO Copy 'input_lra' value into a tag named 'LRA' within foobar
PAUSE