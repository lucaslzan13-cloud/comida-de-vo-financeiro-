from pathlib import Path
import re

p = Path('financeiro/build.gradle')
s = p.read_text(encoding='utf-8')

s = re.sub(r"versionCode\s+\d+", "versionCode 27", s, count=1)
s = re.sub(r"versionName\s+'[^']+'", "versionName '4.0.2'", s, count=1)

if "implementation 'androidx.core:core:1.17.0'" not in s:
    s = s.replace("dependencies {", "dependencies {\n    implementation 'androidx.core:core:1.17.0'", 1)

if 'import androidx.core.content.ContextCompat;' not in s:
    s = s.replace('import android.os.CancellationSignal;', 'import android.os.CancellationSignal;\nimport androidx.core.content.ContextCompat;', 1)

# Keep the Credential Manager callback on Android's main executor. The previous
# build used a worker executor and then touched Toast/UI from that worker.
s = s.replace('Executors.newSingleThreadExecutor()', 'ContextCompat.getMainExecutor(a)')

# Move the Google connection action to immediately below the balance cards.
old_top = 'balance=totalValue("Saldo","R$ 0,00",BLUE);totals.addView(balance);root.addView(totals);margin(totals,0,9);'
new_top = 'balance=totalValue("Saldo","R$ 0,00",BLUE);totals.addView(balance);root.addView(totals);margin(totals,0,7);if(!GoogleSync40.connected()){TextView google=action("Conectar conta Google",16);google.setTextColor(Color.WHITE);google.setBackground(bg(NAVY,14,0));google.setPadding(dp(8),dp(12),dp(8),dp(12));google.setOnClickListener(v->GoogleSync40.signIn(this));root.addView(google,lp(-1,dp(52)));margin(google,0,9);}'
if old_top in s:
    s = s.replace(old_top, new_top, 1)

# Remove the old hidden connection button from the bottom section if present.
old_bottom = 'if(!GoogleSync40.connected()){ TextView backup=action("Conectar conta Google",15);backup.setTextColor(Color.WHITE);backup.setBackground(bg(NAVY,14,0));backup.setOnClickListener(v->GoogleSync40.signIn(this));tools.addView(backup);margin(backup,6,0); }'
s = s.replace(old_bottom, '', 1)

# Remove the standalone manual backup action that is no longer needed by the
# native Google sync flow, while keeping Restore backup available.
s = s.replace('TextView backup=action("Fazer backup",14);backup.setBackground(bg(Color.rgb(229,231,235),12,0));backup.setOnClickListener(v->backup());tools.addView(backup);margin(backup,6,0);', '', 1)

# Ensure sign-in failure never escapes the callback thread and closes the app.
s = s.replace('}catch(Exception e){Toast.makeText(a,"Não foi possível ler a conta Google.",Toast.LENGTH_LONG).show();}', '}catch(Exception e){Toast.makeText(a,"Não foi possível concluir a conexão Google.",Toast.LENGTH_LONG).show();}', 1)

p.write_text(s, encoding='utf-8')
print('Financeiro patched to 4.0.2')
