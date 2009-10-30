FireBBS.l-hedgehog
==================

History
-------

I found [FireBBS][1] when I tried to switch from web to telnet, on November
2007. While it __IS__ a wonderful extension, I felt there are some useful
modifications I can make. More details about my modifications can be found
[here][2], whose file name may not be a proper one. :-)

Tips
----

*   Copy & Paste
    *   Copy as plain text: select the text you want and "^C";
    *   Copy as ASCII code: use "Shift + ^C" instead of "^C";
    *   Paste for both: use "Shift + ^V", __NOT__ "^V".
*   Preferences
    1.  Go to "about:config";
    2.  In the filter, search for "extensions.firebbs.";
    3.  There will be:
        *   "bgcolor", background color, web standard color names preferred,
            "#080808" is ok but only in "about:config";
        *   "charset", encodings, e.g. "big5";
        *   "fontfamily";
        *   "fontsize";
        *   "sound", path of the sound to be played when receiving messages,
            leave it blank to use system default;
    4.  Also, [telnet://ptt.cc/?charset=big5&fontfamily=MingLiU][3] will work,
        with the exception of "sound".

  [1]: http://firebbs.googlepages.com
  [2]: /l-hedgehog/firebbs.l-hedgehog/blob/master/release_note.txt
  [3]: telnet://ptt.cc/?charset=big5&fontfamily=MingLiU
