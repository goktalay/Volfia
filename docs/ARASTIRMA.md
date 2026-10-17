# Volfied Araştırma Notları

VOLFAI, Taito'nun 1989 tarihli arcade oyunu **Volfied**'in (Qix'in devamı) mobil / dokunmatik
yeniden yapımıdır. Aşağıdaki notlar oyunun tasarımına temel olan kaynak bilgilerdir.

## Orijinal oyun (Volfied, Taito 1989)

- Qix'in (1981) halefi. Oyuncu "Monotros" adlı küçük bir gemiyi yönetir; düşmanlar uzaylılardır.
- Temel döngü: Sahanın kenarında güvendesin. Boş alana girip hat çizer, kenara geri dönünce
  hat kapanır. **Ana düşmanın (boss) bulunduğu taraf "dış" kalır**, diğer taraf senin olur.
- Bölümü geçmek için alanın **en az %80'i** ele geçirilmelidir (Qix'te %75, Super Qix'te %70 idi).
  %80'in üstündeki her yüzde için bonus verilir.
- Kapatılan alanda kalan **küçük düşmanlar yok olur** ve bonus puan verir. Boss yok edilemez
  (lazer hariç).
- **Yalnızca hat çizerken zarar görürsün.** Kenarda güvendesin. Düşman çizdiğin hatta değerse
  hat boyunca bir fitil yanar; hattı zamanında kapatamazsan can kaybedersin.
- Sahada **gri kutular** vardır. İçlerinden hat çizilemez; bir kutuyu tamamen kuşatırsan
  üzerindeki harfe göre güçlendirme alırsın:
  - **S** – hız artışı
  - **T** – tüm düşmanları birkaç saniye dondurur
  - **L** – kısa süreli lazer (küçük düşmanları tek atışta öldürür, boss'a hasar verir)
  - **P** – kalkan/zaman dondurma (kaynaklara göre değişiyor)
  - Ayrıca puan bonusu veren kutular vardır.
- Lazerle boss'u yok etmek **"Special Clear"** sayılır ve büyük puan bonusu verir.
- Bir bölümdeki **tüm kutuları kuşatmak** süper silah ve dev bonus verir.
- Her bölümün kendine özgü arka plan resmi vardır; alan kapattıkça resim ortaya çıkar.
- Her bölümün sıkı bir zaman sınırı vardır.
- Boss'un hareketi yarı rastgeledir ancak zamanlanmış saldırı kalıpları ve animasyon ipuçları vardır.
- Portlar: PC Engine, Mega Drive (Ultimate Qix), Amiga, Atari ST, **MS-DOS (Empire Interactive)**,
  FM Towns, PlayStation (Qix Neo), Taito Legends, Arcade Archives (2024).

## VOLFAI'da modernleştirme kararları

| Orijinal | VOLFAI |
|---|---|
| Joystick + "çiz" düğmesi | Yüzen sanal joystick: parmağını herhangi bir yere koy, sürükle. Boş alana girince otomatik çizilir. |
| Yön tuşlarıyla köşe dönme | Joystick'in ikinci ekseni "köşe yardımı" olarak kullanılır. |
| Lazer yönü = bakış yönü | Lazer otomatik olarak boss'a nişan alır (dokunmatikte nişan almak zordur). |
| Piksel arka plan resimleri | Her bölüm için prosedürel olarak çizilen gezegen/nebula sahneleri. |
| Arcade zaman sınırı | Süre bitince düşmanlar hızlanır ("ACELE ET!"), anında ölüm yok. |
| Dikey arcade ekranı | Dikey (portrait) telefon düzeni, PWA olarak ana ekrana eklenebilir. |

## Kaynaklar

- https://en.wikipedia.org/wiki/Volfied
- https://moegamer.net/2019/01/28/taito-essentials-volfied/
- https://arcadeheroes.com/2008/01/31/shaggys-weekly-review-volfied-by-taito/
- https://www.arcade-history.com/game/3086/volfied
- https://giantbomb.com/wiki/Games/Volfied
- https://strategywiki.org/wiki/Volfied
