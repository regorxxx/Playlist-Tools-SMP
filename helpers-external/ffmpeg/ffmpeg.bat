REM Helper to execute ffmpeg.exe (%3) on input (%1) and save output to file (%2)
REM Retrieves LRA data as json
@ECHO OFF
%3 -i %1 -af loudnorm=dual_mono=true:print_format=json -nostats -f null -  2>&1 | > %2 FINDSTR /BIR "{ .*\" }"