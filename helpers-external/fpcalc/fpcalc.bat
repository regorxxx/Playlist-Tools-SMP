REM Helper to execute fpcalc.exe (%3) on input (%1) and save output to file (%2)
REM Retrieves raw fingerprint as json
@ECHO OFF
%3 -raw -json -length 240 %1>%2