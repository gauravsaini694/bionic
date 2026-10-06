#!/usr/bin/env bash
# Run from this folder: bash download-photos.sh
set -e
dl(){ curl -fsSL -o "$1.jpg" "https://static.wixstatic.com/media/$2~mv2.jpg/v1/fill/w_600,h_600,al_c,q_85/$1.jpg" && echo "ok $1"; }
dl rani-saxena       45f797_57af775cca564a089800b1c8f74ec7b9
dl brad-watson       45f797_ab494d6926134a81a836e74b8eb9fd0d
dl dheeraj-bhambhani 45f797_8a4e2b6b5d7e444bb9f1b67237d185e8
dl tony-gutierrez    45f797_d3b6f2781046421f863818f3f447fb00
dl michael-poynter   45f797_f6cd6b0c1bc5402bb13cfa6d0275f9d1
