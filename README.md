# Django Chat App

Bu proje, Django ve Channels kullanılarak geliştirilmiş gerçek zamanlı bir sohbet uygulamasıdır.

## Özellikler
- Gerçek zamanlı mesajlaşma
- Kullanıcı girişi ve odalar
- WebSocket desteği
- Basit arayüz

## Kurulum

1. Depoyu klonlayın:
   ```bash
   git clone <repo-url>
   cd django_chat_app
   ```
2. Sanal ortamı oluşturun ve etkinleştirin:
   ```bash
   python -m venv venv
   # Windows için:
   venv\Scripts\activate
   # Linux/Mac için:
   source venv/bin/activate
   ```
3. Bağımlılıkları yükleyin:
   ```bash
   pip install -r requirements.txt
   ```
   veya
   ```bash
   pip install django channels channels_redis
   ```
4. Veritabanı migrasyonlarını uygulayın:
   ```bash
   python mysite/manage.py migrate
   ```
5. Sunucuyu başlatın:
   ```bash
   python mysite/manage.py runserver
   ```

## Kullanım

Tarayıcınızda `http://127.0.0.1:8000/` adresine giderek uygulamayı kullanmaya başlayabilirsiniz.


## Ek Bağımlılıklar ve Servisler

### PeerJS Sunucusu
Gerçek zamanlı video/görüntülü görüşme için PeerJS sunucusu gereklidir.

PeerJS'i kurmak için:

#### Proje klasöründe lokal kurulum:
```bash
npm install peerjs
```
veya global kurulum:
```bash
npm install -g peerjs
```

PeerJS sunucusunu başlatmak için:
```bash
npx peerjs --port 9000
```
veya global kurulum yaptıysanız:
```bash
peerjs --port 9000
```

### Redis Sunucusu
Gerçek zamanlı mesajlaşma için Channels ile birlikte Redis kullanılır.

#### Ubuntu'da Redis kurulumu ve başlatılması:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### Docker ile Redis başlatmak için:
```bash
docker run -d -p 6379:6379 --name redis redis
```

## Docker ile Çalıştırma (Opsiyonel)

Projenizi Docker ile çalıştırmak için örnek bir `docker-compose.yml` dosyası oluşturabilirsiniz:

```yaml
db:
  image: redis
  ports:
    - "6379:6379"

web:
  build: .
  command: python mysite/manage.py runserver 0.0.0.0:8000
  volumes:
    - .:/code
  ports:
    - "8000:8000"
  depends_on:
    - db
```

PeerJS için ayrı bir container başlatmak isterseniz:
```bash
docker run -d -p 9000:9000 --name peerjs peerjs/peerjs-server --port 9000
```

## Notlar
- PeerJS sunucusunun 9000 portunda çalıştığından emin olun.
- Redis sunucusu arka planda çalışıyor olmalı.
- Geliştirme ortamında Ubuntu veya Docker kullanmak işleri kolaylaştırabilir. 
