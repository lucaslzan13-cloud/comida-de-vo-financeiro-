from pathlib import Path
import re

p = Path('financeiro/build.gradle')
s = p.read_text(encoding='utf-8')

s = re.sub(r"versionCode\s+\d+", "versionCode 28", s, count=1)
s = re.sub(r"versionName\s+'[^']+'", "versionName '4.0.3'", s, count=1)

if "implementation 'androidx.core:core:1.17.0'" not in s:
    s = s.replace("dependencies {", "dependencies {\n    implementation 'androidx.core:core:1.17.0'", 1)

if 'import androidx.core.content.ContextCompat;' not in s:
    s = s.replace('import android.os.CancellationSignal;', 'import android.os.CancellationSignal;\\nimport androidx.core.content.ContextCompat;', 1)

# Credential Manager callbacks must return on Android's main executor before
# touching Toasts or the Activity UI.
s = s.replace('Executors.newSingleThreadExecutor()', 'ContextCompat.getMainExecutor(a)')

# Remove the previous brittle UI insertion from the Gradle source-injection
# string. The button is now patched directly into MainActivity.java below.
s = re.sub(r'if\(!GoogleSync40\.connected\(\)\)\{TextView google=action\("Conectar conta Google".*?margin\(google,0,9\);\}', '', s, count=1)
s = re.sub(r'if\(!GoogleSync40\.connected\(\)\)\{ TextView backup=action\("Conectar conta Google".*?margin\(backup,6,0\); \}', '', s, count=1)

# Remove the obsolete manual backup action; Google sync replaces it.
s = s.replace('TextView backup=action("Fazer backup",14);backup.setBackground(bg(Color.rgb(229,231,235),12,0));backup.setOnClickListener(v->backup());tools.addView(backup);margin(backup,6,0);', '', 1)

# Keep sign-in failures inside the callback instead of allowing an exception
# to propagate and close the Activity.
s = s.replace('}catch(Exception e){Toast.makeText(a,"Não foi possível ler a conta Google.",Toast.LENGTH_LONG).show();}', '}catch(Exception e){Toast.makeText(a,"Não foi possível concluir a conexão Google.",Toast.LENGTH_LONG).show();}', 1)

p.write_text(s, encoding='utf-8')

# Put the Google connection control directly in the real Activity source,
# immediately below the balance. This avoids the earlier nested Gradle-string
# replacement that silently failed to place the button on the visible screen.
jp = Path('financeiro/src/main/java/br/com/comidadevo/financeiro/MainActivity.java')
j = jp.read_text(encoding='utf-8')
marker = 'root.addView(totals);margin(totals,0,9);'
button = ('root.addView(totals);margin(totals,0,7);'
          'if(!GoogleSync40.connected()){'
          'TextView google=action("Conectar conta Google",16);'
          'google.setTextColor(Color.WHITE);'
          'google.setBackground(bg(NAVY,14,0));'
          'google.setPadding(dp(8),dp(12),dp(8),dp(12));'
          'google.setOnClickListener(v->GoogleSync40.signIn(this));'
          'root.addView(google,lp(-1,dp(52)));'
          'margin(google,0,9);}')
if marker in j and 'root.addView(google,lp(-1,dp(52)))' not in j:
    j = j.replace(marker, button, 1)
jp.write_text(j, encoding='utf-8')
print('Financeiro patched to 4.0.3')
