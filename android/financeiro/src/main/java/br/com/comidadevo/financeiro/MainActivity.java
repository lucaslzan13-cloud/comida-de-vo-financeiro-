package br.com.comidadevo.financeiro;

import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.*;
import android.widget.*;
import org.json.*;
import java.io.*;
import java.text.*;
import java.util.*;

public class MainActivity extends Activity {
    private static final int BG=Color.rgb(243,244,246), NAVY=Color.rgb(17,24,39), GREEN=Color.rgb(22,132,67), RED=Color.rgb(190,35,35), BLUE=Color.rgb(37,84,204), BORDER=Color.rgb(210,214,220);
    private static final int REQ_RESTORE=9001, REQ_BACKUP=9002;
    private final String[] ENTRY={"Dinheiro","Cartão","Pix","Pix Online","iFood"};
    private final String[] EXPENSE={"Mercado","Açougue","Embalagens","Funcionários","Motoboy","Contas","Água","Luz","Mais"};
    private ArrayList<Tx> data=new ArrayList<>(); private SharedPreferences prefs;
    private LinearLayout root,categoryBox,historyBox,summaryBox; private TextView inTotal,outTotal,balance,saveButton,editingLabel,monthLabel,inButton,outButton,dateButton;
    private EditText amount,description; private String type="out",category="Mercado",date; private String editingId=null,filter="all"; private int monthOffset=0;

    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        getWindow().setStatusBarColor(NAVY);
        getWindow().setNavigationBarColor(BG);
        int flags=View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        if(android.os.Build.VERSION.SDK_INT>=23) flags&=~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        getWindow().getDecorView().setSystemUiVisibility(flags);
        prefs=getSharedPreferences("financeiro_native",MODE_PRIVATE); load(); date=today(); build();
    }
    private String today(){return new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(new Date());}
    private int dp(int n){return (int)(n*getResources().getDisplayMetrics().density+.5f);}
    private TextView tv(String s,int sp,int color,boolean bold){TextView v=new TextView(this);v.setText(s);v.setTextSize(sp);v.setTextColor(color);v.setTypeface(Typeface.DEFAULT,bold?Typeface.BOLD:Typeface.NORMAL);return v;}
    private GradientDrawable bg(int color,int r,int stroke){GradientDrawable g=new GradientDrawable();g.setColor(color);g.setCornerRadius(dp(r));if(stroke>0)g.setStroke(dp(1),BORDER);return g;}
    private TextView action(String text,int size){TextView v=tv(text,size,NAVY,true);v.setGravity(Gravity.CENTER);v.setPadding(dp(4),0,dp(4),0);v.setMinHeight(0);v.setBackground(bg(Color.WHITE,14,1));v.setClickable(true);v.setFocusable(true);return v;}
    private LinearLayout card(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);l.setPadding(dp(16),dp(14),dp(16),dp(14));l.setBackground(bg(Color.WHITE,22,0));return l;}
    private void margin(View v,int top,int bottom){ViewGroup.LayoutParams old=v.getLayoutParams();LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(old==null?-1:old.width,old==null?-2:old.height);p.setMargins(0,dp(top),0,dp(bottom));if(old instanceof LinearLayout.LayoutParams){LinearLayout.LayoutParams o=(LinearLayout.LayoutParams)old;p.weight=o.weight;p.gravity=o.gravity;}v.setLayoutParams(p);}
    private LinearLayout.LayoutParams lp(int w,int h){return new LinearLayout.LayoutParams(w,h);}
    private LinearLayout.LayoutParams weighted(int h){return new LinearLayout.LayoutParams(0,dp(h),1f);}

    private void build(){
        FrameLayout frame=new FrameLayout(this);frame.setBackgroundColor(BG);
        ScrollView scroll=new ScrollView(this);scroll.setBackgroundColor(BG);scroll.setFillViewport(false);scroll.setFitsSystemWindows(true);
        root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(dp(14),dp(8),dp(14),dp(14));root.setBackgroundColor(BG);
        scroll.addView(root,new ScrollView.LayoutParams(-1,-2));frame.addView(scroll,new FrameLayout.LayoutParams(-1,-1));
        View statusBg=new View(this);statusBg.setBackgroundColor(NAVY);statusBg.setClickable(false);
        int statusH=dp(24);int id=getResources().getIdentifier("status_bar_height","dimen","android");if(id>0)statusH=getResources().getDimensionPixelSize(id);
        FrameLayout.LayoutParams sbp=new FrameLayout.LayoutParams(-1,statusH,Gravity.TOP);frame.addView(statusBg,sbp);
        setContentView(frame);
        LinearLayout head=card();head.setPadding(dp(16),dp(10),dp(16),dp(12));head.setBackground(bg(NAVY,22,0));head.addView(tv("Comida de Vó",27,Color.WHITE,true));head.addView(tv("Controle financeiro",15,Color.LTGRAY,false));root.addView(head);margin(head,0,9);
        LinearLayout totals=new LinearLayout(this);totals.setOrientation(LinearLayout.VERTICAL);LinearLayout row=new LinearLayout(this);row.setOrientation(LinearLayout.HORIZONTAL);
        inTotal=totalValue("Entradas","R$ 0,00",GREEN);outTotal=totalValue("Gastos","R$ 0,00",RED);row.addView(inTotal,weighted(-2));LinearLayout.LayoutParams rp=weighted(-2);rp.setMargins(dp(5),0,0,0);row.addView(outTotal,rp);totals.addView(row);balance=totalValue("Saldo","R$ 0,00",BLUE);totals.addView(balance);root.addView(totals);margin(totals,0,9);
        buildLaunch();buildSummary();buildHistory();refresh();
    }
    private TextView totalValue(String label,String value,int color){TextView v=tv(label+"\n"+value,16,color,true);v.setGravity(Gravity.LEFT|Gravity.CENTER_VERTICAL);v.setPadding(dp(12),dp(8),dp(12),dp(8));v.setBackground(bg(Color.WHITE,20,0));return v;}
    private void buildLaunch(){
        LinearLayout launch=card();TextView lt=tv("Novo lançamento",21,NAVY,true);launch.addView(lt);margin(lt,0,8);
        LinearLayout types=new LinearLayout(this);types.setOrientation(LinearLayout.HORIZONTAL);outButton=action("Gasto",15);inButton=action("Entrada",15);types.addView(outButton,weighted(46));LinearLayout.LayoutParams ip=weighted(46);ip.setMargins(dp(6),0,0,0);types.addView(inButton,ip);launch.addView(types);margin(types,0,8);
        TextView vl=tv("Valor",13,Color.DKGRAY,false);launch.addView(vl);margin(vl,0,2);amount=new EditText(this);amount.setHint("R$ 0,00");amount.setTextSize(26);amount.setSingleLine(true);amount.setInputType(2|8192);amount.setPadding(dp(12),0,dp(12),0);amount.setBackground(bg(Color.WHITE,14,1));launch.addView(amount);margin(amount,0,7);
        TextView cl=tv("Categoria",13,Color.DKGRAY,false);launch.addView(cl);margin(cl,0,2);categoryBox=new LinearLayout(this);categoryBox.setOrientation(LinearLayout.VERTICAL);launch.addView(categoryBox);margin(categoryBox,0,5);
        editingLabel=tv("",12,BLUE,true);editingLabel.setGravity(Gravity.CENTER);launch.addView(editingLabel);margin(editingLabel,0,1);
        LinearLayout dateRow=new LinearLayout(this);dateRow.setGravity(Gravity.CENTER_VERTICAL);dateRow.addView(tv("Data",13,Color.DKGRAY,false),new LinearLayout.LayoutParams(0,-2,1));dateButton=action(formatDate(date),14);dateRow.addView(dateButton,lp(dp(122),dp(40)));launch.addView(dateRow);dateButton.setOnClickListener(v->pickDate());margin(dateRow,0,6);
        description=new EditText(this);description.setHint("Descrição (opcional)");description.setTextSize(15);description.setSingleLine(true);description.setPadding(dp(12),0,dp(12),0);description.setBackground(bg(Color.WHITE,13,1));launch.addView(description);margin(description,0,8);
        saveButton=tv("Salvar lançamento",16,Color.WHITE,true);saveButton.setGravity(Gravity.CENTER);saveButton.setPadding(0,dp(12),0,dp(12));saveButton.setBackground(bg(NAVY,14,0));saveButton.setClickable(true);launch.addView(saveButton);saveButton.setOnClickListener(v->save());root.addView(launch);margin(launch,0,9);
        outButton.setOnClickListener(v->{type="out";category="Mercado";refreshMode();});inButton.setOnClickListener(v->{type="in";category="Dinheiro";refreshMode();});refreshMode();
    }
    private void refreshMode(){
        outButton.setTextColor(type.equals("out")?Color.WHITE:NAVY);outButton.setBackground(bg(type.equals("out")?NAVY:Color.WHITE,14,1));
        inButton.setTextColor(type.equals("in")?Color.WHITE:NAVY);inButton.setBackground(bg(type.equals("in")?GREEN:Color.WHITE,14,1));
        categoryBox.removeAllViews();String[] arr=type.equals("in")?ENTRY:EXPENSE;
        for(int i=0;i<arr.length;i+=3){
            LinearLayout line=new LinearLayout(this);line.setOrientation(LinearLayout.HORIZONTAL);
            for(int j=i;j<Math.min(i+3,arr.length);j++){
                String c=arr[j];TextView b=action(c,13);b.setTextColor(c.equals(category)?Color.WHITE:NAVY);b.setBackground(bg(c.equals(category)?(type.equals("in")?GREEN:NAVY):Color.WHITE,13,1));b.setOnClickListener(v->{category=c;refreshMode();});
                LinearLayout.LayoutParams p=weighted(42);if(j>i)p.setMargins(dp(5),0,0,0);line.addView(b,p);
            }
            categoryBox.addView(line,lp(-1,dp(42)));if(i+3<arr.length)margin(line,0,5);
        }
    }
    private void buildSummary(){
        LinearLayout card=card();LinearLayout nav=new LinearLayout(this);nav.setGravity(Gravity.CENTER_VERTICAL);TextView prev=action("‹",18),next=action("›",18);monthLabel=tv("",17,NAVY,true);monthLabel.setGravity(Gravity.CENTER);
        nav.addView(prev,lp(dp(44),dp(40)));nav.addView(monthLabel,new LinearLayout.LayoutParams(0,dp(40),1));nav.addView(next,lp(dp(44),dp(40)));prev.setOnClickListener(v->{monthOffset--;refresh();});next.setOnClickListener(v->{monthOffset++;refresh();});card.addView(nav);
        summaryBox=new LinearLayout(this);summaryBox.setOrientation(LinearLayout.VERTICAL);card.addView(summaryBox);root.addView(card);margin(card,0,9);
    }
    private void buildHistory(){
        LinearLayout tools=card();TextView h=tv("Histórico",21,NAVY,true);tools.addView(h);margin(h,0,6);
        LinearLayout filters=new LinearLayout(this);filters.setOrientation(LinearLayout.HORIZONTAL);String[] fs={"Todos","Entradas","Gastos"};
        for(int i=0;i<fs.length;i++){String f=fs[i];TextView b=action(f,13);b.setOnClickListener(v->{filter=f.equals("Entradas")?"in":f.equals("Gastos")?"out":"all";refresh();});LinearLayout.LayoutParams fp=weighted(40);if(i>0)fp.setMargins(dp(5),0,0,0);filters.addView(b,fp);}tools.addView(filters);historyBox=new LinearLayout(this);historyBox.setOrientation(LinearLayout.VERTICAL);tools.addView(historyBox);
        TextView backup=action("Fazer backup",14);backup.setBackground(bg(Color.rgb(229,231,235),12,0));backup.setOnClickListener(v->backup());tools.addView(backup);margin(backup,6,0);
        TextView restore=action("Restaurar backup",14);restore.setBackground(bg(Color.rgb(229,231,235),12,0));restore.setOnClickListener(v->restore());tools.addView(restore);margin(restore,6,0);
        root.addView(tools);margin(tools,0,9);
    }
    private Calendar selectedCalendar(){Calendar c=Calendar.getInstance();c.set(Calendar.DAY_OF_MONTH,1);c.add(Calendar.MONTH,monthOffset);return c;}
    private String selectedMonth(){return new SimpleDateFormat("yyyy-MM",Locale.US).format(selectedCalendar().getTime());}
    private String monthTitle(){return new SimpleDateFormat("MMMM 'de' yyyy",new Locale("pt","BR")).format(selectedCalendar().getTime());}
    private void pickDate(){Calendar c=Calendar.getInstance();try{c.setTime(new SimpleDateFormat("yyyy-MM-dd",Locale.US).parse(date));}catch(Exception ignored){}new DatePickerDialog(this,(v,y,m,d)->{date=String.format(Locale.US,"%04d-%02d-%02d",y,m+1,d);dateButton.setText(formatDate(date));},c.get(Calendar.YEAR),c.get(Calendar.MONTH),c.get(Calendar.DAY_OF_MONTH)).show();}
    private String formatDate(String s){try{return new SimpleDateFormat("dd/MM/yyyy",Locale.US).format(new SimpleDateFormat("yyyy-MM-dd",Locale.US).parse(s));}catch(Exception e){return s;}}
    private double parseAmount(){String s=amount.getText().toString().replace("R$","").replace(" ","").trim();try{if(s.contains(",")&&s.contains(".")){s=s.replace(".","").replace(",",".");}else if(s.contains(",")){s=s.replace(",",".");}return Double.parseDouble(s);}catch(Exception e){return 0;}}
    private void save(){double a=parseAmount();if(a<=0){amount.setError("Digite um valor");return;}amount.setError(null);boolean editing=editingId!=null;Tx x=editing?find(editingId):new Tx();if(x==null)return;if(!editing){x.id=UUID.randomUUID().toString();data.add(0,x);}x.type=type;x.amount=a;x.category=category;x.date=date;x.desc=description.getText().toString().trim();persist();clearForm();refresh();Toast.makeText(this,editing?"Alteração salva":"Lançamento salvo",Toast.LENGTH_SHORT).show();}
    private void clearForm(){editingId=null;editingLabel.setText("");saveButton.setText("Salvar lançamento");amount.setText("");description.setText("");date=today();dateButton.setText(formatDate(date));type="out";category="Mercado";refreshMode();}
    private Tx find(String id){for(Tx x:data)if(x.id.equals(id))return x;return null;}
    private void refresh(){String month=selectedMonth();monthLabel.setText(cap(monthTitle()));double ins=0,outs=0;HashMap<String,Double> cats=new HashMap<>();for(Tx x:data)if(x.date!=null&&x.date.startsWith(month)){if("in".equals(x.type))ins+=x.amount;else{outs+=x.amount;cats.put(x.category,cats.containsKey(x.category)?cats.get(x.category)+x.amount:x.amount);}}setTotal(inTotal,"Entradas\nR$ "+money(ins),GREEN);setTotal(outTotal,"Gastos\nR$ "+money(outs),RED);setTotal(balance,"Saldo\nR$ "+money(ins-outs),ins-outs>=0?BLUE:RED);
        summaryBox.removeAllViews();TextView st=tv("Gastos por categoria",14,NAVY,true);summaryBox.addView(st);if(cats.isEmpty())summaryBox.addView(tv("Nenhum gasto neste mês.",13,Color.GRAY,false));else for(String c:EXPENSE)if(cats.containsKey(c)){TextView r=tv(c+"  —  R$ "+money(cats.get(c)),13,Color.DKGRAY,false);r.setPadding(0,dp(4),0,dp(4));summaryBox.addView(r);}
        historyBox.removeAllViews();ArrayList<Tx> shown=new ArrayList<>();for(Tx x:data)if(x.date!=null&&x.date.startsWith(month)&&(filter.equals("all")||x.type.equals(filter)))shown.add(x);Collections.sort(shown,(a,b)->{int d=b.date.compareTo(a.date);return d!=0?d:Integer.compare(data.indexOf(a),data.indexOf(b));});if(shown.isEmpty()){TextView n=tv("Nenhum lançamento neste filtro.",14,Color.GRAY,false);n.setGravity(Gravity.CENTER);historyBox.addView(n);}else for(Tx x:shown)historyRow(x);
    }
    private String cap(String s){return s.substring(0,1).toUpperCase(new Locale("pt","BR"))+s.substring(1);}
    private void setTotal(TextView t,String s,int color){t.setText(s);t.setTextColor(color);}
    private String money(double n){return String.format(new Locale("pt","BR"),"%,.2f",n).replace(".","#").replace(",",".").replace("#",",");}
    private void historyRow(Tx x){LinearLayout row=new LinearLayout(this);row.setOrientation(LinearLayout.VERTICAL);row.setPadding(0,dp(8),0,dp(8));row.addView(tv((x.type.equals("in")?"Entrada • ":"Gasto • ")+x.category,15,NAVY,true));row.addView(tv(formatDate(x.date)+(x.desc.isEmpty()?"":" • "+x.desc),12,Color.GRAY,false));LinearLayout actions=new LinearLayout(this);TextView val=tv((x.type.equals("in")?"+ R$ ":"- R$ ")+money(x.amount),16,x.type.equals("in")?GREEN:RED,true);actions.addView(val,new LinearLayout.LayoutParams(0,-2,1));TextView edit=action("Editar",13),del=action("Excluir",13);edit.setOnClickListener(v->edit(x));del.setOnClickListener(v->delete(x));actions.addView(edit,lp(dp(72),dp(38)));LinearLayout.LayoutParams dd=lp(dp(72),dp(38));dd.setMargins(dp(5),0,0,0);actions.addView(del,dd);row.addView(actions);historyBox.addView(row);}
    private void edit(Tx x){editingId=x.id;type=x.type;category=x.category;amount.setText(money(x.amount));description.setText(x.desc);date=x.date;dateButton.setText(formatDate(date));editingLabel.setText("Editando lançamento");saveButton.setText("Salvar alteração");refreshMode();amount.requestFocus();amount.setSelection(amount.length());}
    private void delete(Tx x){new AlertDialog.Builder(this).setTitle("Excluir lançamento?").setMessage(x.category+" • R$ "+money(x.amount)).setNegativeButton("Cancelar",null).setPositiveButton("Excluir",(d,w)->{data.remove(x);persist();refresh();}).show();}
    private JSONArray dataJson(){JSONArray a=new JSONArray();for(Tx x:data){try{JSONObject o=new JSONObject();o.put("id",x.id);o.put("type",x.type);o.put("amount",x.amount);o.put("category",x.category);o.put("date",x.date);o.put("desc",x.desc);a.put(o);}catch(Exception ignored){}}return a;}
    private void persist(){prefs.edit().putString("data",dataJson().toString()).apply();}
    private void load(){try{JSONArray a=new JSONArray(prefs.getString("data","[]"));for(int i=0;i<a.length();i++){JSONObject o=a.getJSONObject(i);Tx x=new Tx();x.id=o.optString("id",UUID.randomUUID().toString());x.type=o.optString("type","out");x.amount=o.optDouble("amount",0);x.category=o.optString("category",x.type.equals("in")?"Dinheiro":"Mercado");x.date=o.optString("date",today());x.desc=o.optString("desc","");data.add(x);}}catch(Exception ignored){data.clear();}}
    private void backup(){Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("application/json");i.putExtra(Intent.EXTRA_TITLE,"comida-de-vo-backup-"+new SimpleDateFormat("yyyyMMdd-HHmm",Locale.US).format(new Date())+".json");startActivityForResult(i,REQ_BACKUP);}
    private void restore(){Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("application/json");startActivityForResult(i,REQ_RESTORE);}
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent intent){super.onActivityResult(requestCode,resultCode,intent);if(resultCode!=RESULT_OK||intent==null||intent.getData()==null)return;try{if(requestCode==REQ_BACKUP){OutputStream out=getContentResolver().openOutputStream(intent.getData());out.write(dataJson().toString(2).getBytes("UTF-8"));out.close();Toast.makeText(this,"Backup salvo",Toast.LENGTH_SHORT).show();}else if(requestCode==REQ_RESTORE){InputStream in=getContentResolver().openInputStream(intent.getData());ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buf=new byte[4096];int n;while((n=in.read(buf))!=-1)out.write(buf,0,n);in.close();JSONArray a=new JSONArray(out.toString("UTF-8"));ArrayList<Tx> restored=new ArrayList<>();for(int i=0;i<a.length();i++){JSONObject o=a.getJSONObject(i);Tx x=new Tx();x.id=o.optString("id",UUID.randomUUID().toString());x.type=o.optString("type","out");x.amount=o.optDouble("amount",0);x.category=o.optString("category",x.type.equals("in")?"Dinheiro":"Mercado");x.date=o.optString("date",today());x.desc=o.optString("desc","");restored.add(x);}data=restored;persist();refresh();Toast.makeText(this,"Backup restaurado",Toast.LENGTH_SHORT).show();}}catch(Exception e){Toast.makeText(this,requestCode==REQ_BACKUP?"Não foi possível salvar o backup":"Não foi possível restaurar o backup",Toast.LENGTH_LONG).show();}}
    static class Tx{String id,type,category,date,desc;double amount;}
}
