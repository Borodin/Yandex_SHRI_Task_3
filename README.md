#ШРИ Задание №3 — Аудио плеер

Рабочий пример — [borodin.gihub.io/Yandex_SHRI_Task_3](http://borodin.github.io/Yandex_SHRI_Task_3/)

[![Скриншот плеера](http://maximborodin.ru/works/shri/doc/demo.png?1)](http://borodin.github.io/Yandex_SHRI_Task_3/)

Я немного отошел от задания и вместо кнопок Play и Stop сделал одну кнопку Play/Pause, я думаю она гораздо полезнее.

###Возможности плеера
* Он умеет открывать аудиофайлы с локального диска;
* Поддерживает drag'n'drop;
* Выводит название проигрываемого файла;
* Выводит название трека, имя автора, название и обложку альбома;
* Имеет визуализатор;
* Имеет эквалайзер с готовыми пресетами;
* Отображает обложку в favikon'ке;

Для чтения ID3 тегов использовалась библиотека [@aadsm/JavaScript-ID3-Reader](http://github.com/aadsm/JavaScript-ID3-Reader)

###Поддерживаемые браузеры
* Google Chrome
* Yandex Browser
* Mozilla Firefox
* Safari