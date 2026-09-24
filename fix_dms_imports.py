with open("apps/api/src/v3/v3-dms.controller.ts", "r") as f:
    lines = f.readlines()

seen = set()
clean = []
for line in lines:
    s = line.strip()
    if s.startswith("import * as crypto") or s.startswith("import axios"):
        if s in seen:
            continue
        seen.add(s)
    clean.append(line)

with open("apps/api/src/v3/v3-dms.controller.ts", "w") as f:
    f.writelines(clean)

print("DMs imports cleaned")
