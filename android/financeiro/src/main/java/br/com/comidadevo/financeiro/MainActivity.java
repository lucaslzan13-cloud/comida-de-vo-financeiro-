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
import java.text.*;
import java.util.*;

public class MainActivity extends Activity {
    private static final int BG=Color.rgb(243,244,246), NAVY=Color.rgb(17,24,39), GREEN=Color.rgb(22,132,67), RED=Color.rgb(190,35,35), BLUE=Color.rgb(37,84,204), BORDER=Color.rgb(210,214,220);
    private final String[] ENTRY={"Dinheiro","Cartão","Pix","Pix Online","iFood"};
    private final String[] EXPENSE={"Mercado","Açougue","Embalagens","Funcionários","Motoboy","Contas","Água","Luz","Mais"};
    private ArrayList<Tx> data=new ArrayList<>(); private SharedPreferences prefs;
    private LinearLayout root,categoryBox,historyBox; private TextView inTotal,outTotal,balance,saveButton,editingLabel; private EditText amount,description; private Button inButton,outButton,dateButton;
    private String type="out",category="Mercado",date; private String editingId=null;

    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        getWindow().setStatusBarColor(NAVY);
        getWindow().setNavigationBarColor(BG);
        prefs=getSharedPreferences("financeiro_native",MODE_PRIVATE);
        load();
        date=today();
        build();
    }
    private String today(){return new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(new Date());}
    private int dp(int n){return (int)(n*getResources().getDisplayMetrics().density+.5f);}
    private TextView tv(String s,int sp,int color,boolean bold){TextView v=new TextView(this);v.setText(s);v.setTextSize(sp);v.setTextColor(color);v.setTypeface(Typeface.DEFAULT,bold?Typeface.BOLD:Typeface.NORMAL);return v;}
    private GradientDrawable bg(int color,int r,int stroke){GradientDrawable g=new GradientDrawable();g.setColor(color);g.setCornerRadius(dp(r));if(stroke>0)g.setStroke(dp(1),BORDER);return g;}
    private Button btn(String text){Button b=new Button(this);b.setText(text);b.setTextSize(15);b.setAllCaps(false);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setTextColor(NAVY);b.setPadding(dp(8),0,dp(8),0);return b;}
    private LinearLayout card(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);l.setPadding(dp(20),dp(18),dp(20),dp(18));l.setBackground(bg(Color.WHITE,24,0));return l;}
    private void margin(View v,int top,int bottom){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(0,dp(top),0,dp(bottom));v.setLayoutParams(p);}

    private void build(){
        ScrollView scroll=new ScrollView(this);
        scroll.setBackgroundColor(BG);
        root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(dp(16),dp(18),dp(16),dp(28));scroll.addView(root);setContentView(scroll);

        LinearLayout head=new LinearLayout(this);head.setOrientation(LinearLayout.VERTICAL);head.setPadding(dp(16),dp(10),dp(16),dp(22));head.setBackground(bg(NAVY,24,0));head.addView(tv("Comida de Vó",30,Color.WHITE,true));head.addView(tv("Controle financeiro",17,Color.LTGRAY,false));root.addView(head);margin(head,0,14);

        LinearLayout totals=new LinearLayout(this);totals.setOrientation(LinearLayout.VERTICAL);
        LinearLayout row=new LinearLayout(this);row.setOrientation(LinearLayout.HORIZONTAL);
        inTotal=totalValue("Entradas","R$ 0,00",GREEN);outTotal=totalValue("Gastos","R$ 0,00",RED);
        row.addView(inTotal,new LinearLayout.LayoutParams(0,-2,1));
        LinearLayout.LayoutParams rp=new LinearLayout.LayoutParams(0,-2,1);rp.setMargins(dp(8),0,0,0);row.addView(outTotal,rp);
        totals.addView(row);
        balance=totalValue("Saldo do mês","R$ 0,00",BLUE);totals.addView(balance);root.addView(totals);margin(totals,0,14);

        LinearLayout launch=card();TextView lt=tv("Lançamento",22,NAVY,true);launch.addView(lt);margin(lt,0,12);
        LinearLayout types=new LinearLayout(this);types.setOrientation(LinearLayout.HORIZONTAL);outButton=btn("Gasto");inButton=btn("Entrada");types.addView(outButton,new LinearLayout.LayoutParams(0,dp(54),1));LinearLayout.LayoutParams ip=new LinearLayout.LayoutParams(0,dp(54),1);ip.setMargins(dp(8),0,0,0);types.addView(inButton,ip);launch.addView(types);margin(types,0,12);
        amount=new EditText(this);amount.setHint("0,00");amount.setTextSize(32);amount.setSingleLine(true);amount.setInputType(2|8192);amount.setPadding(dp(16),0,dp(16),0);amount.setBackground(bg(Color.WHITE,16,1));launch.addView(amount);margin(amount,0,12);
        categoryBox=new LinearLayout(this);categoryBox.setOrientation(LinearLayout.VERTICAL);launch.addView(categoryBox);margin(categoryBox,0,8);
        editingLabel=tv("",13,BLUE,true);editingLabel.setGravity(Gravity.CENTER);launch.addView(editingLabel);margin(editingLabel,0,4);
        launch.addView(tv("Data",13,Color.DKGRAY,false));dateButton=btn(formatDate(date));dateButton.setGravity(Gravity.LEFT|Gravity.CENTER_VERTICAL);launch.addView(dateButton);dateButton.setOnClickListener(v->pickDate());margin(dateButton,0,10);
        description=new EditText(this);description.setHint("Descrição (opcional)");description.setTextSize(16);description.setSingleLine(true);description.setPadding(dp(14),0,dp(14),0);description.setBackground(bg(Color.WHITE,14,1));launch.addView(description);margin(description,0,12);
        saveButton=tv("Salvar lançamento",17,Color.WHITE,true);saveButton.setGravity(Gravity.CENTER);saveButton.setPadding(0,dp(16),0,dp(16));saveButton.setBackground(bg(NAVY,16,0));launch.addView(saveButton);saveButton.setOnClickListener(v->save());root.addView(launch);margin(launch,0,14);

        LinearLayout tools=card();tools.addView(tv("Histórico",22,NAVY,true));historyBox=new LinearLayout(this);historyBox.setOrientation(LinearLayout.VERTICAL);tools.addView(historyBox);Button backup=btn("Backup dos dados");backup.setBackground(bg(Color.rgb(229,231,235),14,0));backup.setOnClickListener(v->backup());tools.addView(backup);root.addView(tools);
        outButton.setOnClickListener(v->{type="out";category="Mercado";refreshMode();});inButton.setOnClickListener(v->{type="in";category="Dinheiro";refreshMode();});refreshMode();refresh();
    }

    private TextView totalValue(String label,String value,int color){
        TextView val=tv(label+"\n"+value,15,color,true);
        val.setTextSize(17);
        val.setGravity(Gravity.LEFT|Gravity.CENTER_VERTICAL);
        val.setPadding(dp(16),dp(14),dp(16),dp(14));
        val.setBackground(bg(Color.WHITE,24,0));
        return val;
    }

    private void refreshMode(){outButton.setTextColor(type.equals("out")?Color.WHITE:NAVY);outButton.setBackground(bg(type.equals("out")?NAVY:Color.WHITE,16,1));inButton.setTextColor(type.equals("in")?Color.WHITE:NAVY);inButton.setBackground(bg(type.equals("in")?GREEN:Color.WHITE,16,1));categoryBox.removeAllViews();String[] arr=type.equals("in")?ENTRY:EXPENSE;for(String c:arr){Button b=btn(c);b.setTextSize(15);b.setGravity(Gravity.CENTER);b.setBackground(bg(c.equals(category)?(type.equals("in")?GREEN:NAVY):Color.WHITE,18,1));b.setTextColor(c.equals(category)?Color.WHITE:NAVY);b.setOnClickListener(v->{category=c;refreshMode();});LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(46));p.setMargins(0,0,0,dp(7));categoryBox.addView(b,p);}}
    private void pickDate(){Calendar c=Calendar.getInstance();try{c.setTime(new SimpleDateFormat("yyyy-MM-dd",Locale.US).parse(date));}catch(Exception ignored){}new DatePickerDialog(this,(v,y,m,d)->{date=String.format(Locale.US,"%04d-%02d-%02d",y,m+1,d);dateButton.setText(formatDate(date));},c.get(Calendar.YEAR),c.get(Calendar.MONTH),c.get(Calendar.DAY_OF_MONTH)).show();}
    private String formatDate(String s){try{return new SimpleDateFormat("dd/MM/yyyy",Locale.US).format(new SimpleDateFormat("yyyy-MM-dd",Locale.US).parse(s));}catch(Exception e){return s;}}
    private double parseAmount(){try{return Double.parseDouble(amount.getText().toString().replace(".","").replace(",","."));}catch(Exception e){return 0;}}
    private void save(){double a=parseAmount();if(a<=0){amount.setError("Digite um valor");return;}boolean editing=editingId!=null;Tx x=editing?find(editingId):new Tx();if(x==null)return;if(!editing){x.id=UUID.randomUUID().toString();data.add(0,x);}x.type=type;x.amount=a;x.category=category;x.date=date;x.desc=description.getText().toString().trim();persist();clearForm();refresh();Toast.makeText(this,editing?"Alteração salva":"Lançamento salvo",Toast.LENGTH_SHORT).show();}
    private void clearForm(){editingId=null;editingLabel.setText("");saveButton.setText("Salvar lançamento");amount.setText("");description.setText("");date=today();dateButton.setText(formatDate(date));type="out";category="Mercado";refreshMode();}
    private Tx find(String id){for(Tx x:data)if(x.id.equals(id))return x;return null;}
    private void refresh(){double ins=0,outs=0;String month=new SimpleDateFormat("yyyy-MM",Locale.US).format(new Date());for(Tx x:data)if(x.date.startsWith(month)){if(x.type.equals("in"))ins+=x.amount;else outs+=x.amount;}setTotal(inTotal,"Entradas\nR$ "+money(ins),GREEN);setTotal(outTotal,"Gastos\nR$ "+money(outs),RED);setTotal(balance,"Saldo do mês\nR$ "+money(ins-outs),ins-outs>=0?BLUE:RED);historyBox.removeAllViews();if(data.isEmpty()){TextView n=tv("Nenhum lançamento ainda.",15,Color.GRAY,false);n.setGravity(Gravity.CENTER);historyBox.addView(n);return;}for(Tx x:data)historyRow(x);}
    private void setTotal(TextView t,String s,int color){t.setText(s);t.setTextColor(color);}
    private String money(double n){return String.format(new Locale("pt","BR"),"%,.2f",n).replace(".","#").replace(",",".").replace("#",",");}
    private void historyRow(Tx x){LinearLayout row=new LinearLayout(this);row.setOrientation(LinearLayout.VERTICAL);row.setPadding(0,dp(12),0,dp(12));row.addView(tv((x.type.equals("in")?"Entrada • ":"Gasto • ")+x.category,16,NAVY,true));row.addView(tv(formatDate(x.date)+(x.desc.isEmpty()?"":" • "+x.desc),13,Color.GRAY,false));LinearLayout actions=new LinearLayout(this);TextView val=tv((x.type.equals("in")?"+ R$ ":"- R$ ")+money(x.amount),17,x.type.equals("in")?GREEN:RED,true);actions.addView(val,new LinearLayout.LayoutParams(0,-2,1));Button edit=btn("Editar"),del=btn("Excluir");edit.setOnClickListener(v->edit(x));del.setOnClickListener(v->delete(x));actions.addView(edit,new LinearLayout.LayoutParams(dp(78),dp(42)));LinearLayout.LayoutParams dd=new LinearLayout.LayoutParams(dp(78),dp(42));dd.setMargins(dp(6),0,0,0);actions.addView(del,dd);row.addView(actions);historyBox.addView(row);}
    private void edit(Tx x){editingId=x.id;type=x.type;category=x.category;amount.setText(money(x.amount));description.setText(x.desc);date=x.date;dateButton.setText(formatDate(date));editingLabel.setText("Editando lançamento");saveButton.setText("Salvar alteração");refreshMode();amount.requestFocus();}
    private void delete(Tx x){new AlertDialog.Builder(this).setTitle("Excluir lançamento?").setMessage(x.category+" • R$ "+money(x.amount)).setNegativeButton("Cancelar",null).setPositiveButton("Excluir",(d,w)->{data.remove(x);persist();refresh();}).show();}
    private void persist(){JSONArray a=new JSONArray();try{for(Tx x:data){JSONObject o=new JSONObject();o.put("id",x.id);o.put("type",x.type);o.put("amount",x.amount);o.put("category",x.category);o.put("date",x.date);o.put("desc",x.desc);a.put(o);}}catch(Exception ignored){}prefs.edit().putString("data",a.toString()).apply();}
    private void load(){try{JSONArray a=new JSONArray(prefs.getString("data","[]"));for(int i=0;i<a.length();i++){JSONObject o=a.getJSONObject(i);Tx x=new Tx();x.id=o.getString("id");x.type=o.getString("type");x.amount=o.getDouble("amount");x.category=o.getString("category");x.date=o.getString("date");x.desc=o.optString("desc","");data.add(x);}}catch(Exception ignored){}}
    private void backup(){Intent i=new Intent(Intent.ACTION_SEND);i.setType("text/plain");i.putExtra(Intent.EXTRA_TEXT,prefs.getString("data","[]"));startActivity(Intent.createChooser(i,"Enviar backup dos dados"));}
    static class Tx{String id,type,category,date,desc;double amount;}
}
