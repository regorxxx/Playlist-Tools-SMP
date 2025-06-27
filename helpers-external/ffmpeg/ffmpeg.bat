@ECHO OFF
REM Helper to execute ffmpeg.exe (%3) on input (%1) and save output to file (%2)
REM Retrieves LRA data as json
SET ffPath=%3
SET sedx64=%ffPath:ffmpeg.exe=sed.exe%
SET sed=%sedx64:ffmpeg_32.exe=sed.exe%
SET useSed=TRUE
IF NOT EXIST %sed% SET useSed=FALSE
IF "%useSed%" == "TRUE" (
	%ffPath% -hide_banner -i %1 -af loudnorm=dual_mono=true:print_format=json -nostats -f null - 2>&1 | > %2 %sed% 1,/^^\[Parsed_loudnorm/d;/^^[^^{}[:space:]]/d
) ELSE (
	%ffPath% -hide_banner -i %1 -af loudnorm=dual_mono=true:print_format=json -nostats -f null - 2>&1 | > %2 FINDSTR /BIR "{ .*\" }"
)