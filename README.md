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

*   __Copy & Paste__
    *   Copy as plain text: select the text you want and "^C";
    *   Copy as ASCII code: use "Shift + ^C" instead of "^C";
    *   Paste for both: use "Shift + ^V", __NOT__ "^V".
*   __Preferences__
    *   Options window can be accessed through "Tools / Addons / Extensions";
    *   __READ THE NEXT SECTION__ before you enable IPSearcher;
    *   Press the button to select the sound file you need;
    *   To enable experimental features, you need:
        1.  Go to "about:config";
        2.  In the filter, search for "extensions.firebbs.experiment.";
        3.  There will be:
            *   "bicolorDBCS", experimental support of bicolor DBCS,
                enable it may introduce bugs in text & ASCII copy;
    *   Also, [telnet://ptt.cc/?charset=big5&fontfamily=MingLiU][3] will work,
        for "bgcolor", "charset", "fontfamily" & "fontsize".
*   __IPSearcher__
    *   All platform supported;
    *   How to get a copy of QQwry.dat?
        1.  Download _QQwry.dat_ from [cz88][4];
        2.  Put it into the [profile directory][5];
        3.  Make sure the filename is "_QQwry.dat_", __CASE SENSITIVE__;
        4.  Don't forget to update this file regularly.

  [1]: http://firebbs.googlepages.com
  [2]: /l-hedgehog/firebbs.l-hedgehog/blob/master/release_note.txt
  [3]: telnet://ptt.cc/?charset=big5&fontfamily=MingLiU
  [4]: http://www.cz88.net/
  [5]: https://developer.mozilla.org/en/Runtime_Directories#Firefox
