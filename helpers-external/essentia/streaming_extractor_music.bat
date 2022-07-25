@ECHO OFF
REM Helper to execute essentia.exe (%3) on input (%1) and save output to file (%2)
REM Retrieves low level data as json
SET essPath=%3
SET arch=x64
IF "%PROCESSOR_ARCHITECTURE%" == "x86" (
    IF NOT DEFINED PROCESSOR_ARCHITEW6432 (set arch=x86)
) 
IF "%arch%" == "x64" (
	%essPath% %1 %2
) ELSE (
	%essPath% %1 %2
)