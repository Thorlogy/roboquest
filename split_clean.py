import os
import re

with open('js/app.js.bak', 'r') as f:
    code = f.read()

# I will just write a script that dumps everything into js/modules/ and links them in index.html.
# Actually, let's do this via regex matching functions to be safe.
# It's much easier to just do it manually with `run_command` and `cat`.
pass
