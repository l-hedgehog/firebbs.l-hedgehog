##
## Modified from Pidgin's Makefile.mingw
##
CXX = /usr/bin/i586-pc-mingw32-g++
WINDRES = /usr/bin/i586-pc-mingw32-windres
STRIP = /usr/bin/i586-pc-mingw32-strip

GXXWARNINGS = -Waggregate-return -Wcast-align -Wextra -Wno-sign-compare -Wno-unused-parameter -Wno-write-strings -Winit-self -Wmissing-declarations -Wpointer-arith -Wundef

CXXFLAGS = -O2 -Wall $(GXXWARNINGS) -pipe -mno-cygwin -mms-bitfields -g

DLL_LD_FLAGS = -Wl,--enable-auto-image-base

TARGET = ipsearcher

##
## INCLUDE PATHS
##
INCLUDE_PATHS = -I. -I/usr/i586-pc-mingw32/sys-root/mingw/include/

LIB_PATHS = -L. -L/usr/i586-pc-mingw32/sys-root/mingw/lib/

##
##  SOURCES, OBJECTS
##
CPP_SRC = ipsearcher.cpp
RC_SRC = rc/$(TARGET).rc

OBJECTS = $(CPP_SRC:%.cpp=%.o) $(RC_SRC:%.rc=%.o)

##
## LIBRARIES
##
LIBS = -lws2_32

##
## RULES
##
%.o: %.rc
	$(WINDRES) -c 936 -l 0x0804 $(INCLUDE_PATHS) -i $< -o $@

##
## TARGET DEFINITIONS
##
.PHONY: all clean

all: $(TARGET).dll
	$(STRIP) $(TARGET).dll

$(OBJECTS):

$(TARGET).dll $(TARGET).dll.a: $(OBJECTS)
	$(CXX) -shared $(OBJECTS) $(LIB_PATHS) $(LIBS) $(DLL_LD_FLAGS) -Wl,--output-def,$(TARGET).def,--out-implib,$(TARGET).dll.a -o $(TARGET).dll

##
## CLEAN RULES
##
clean:
	rm -f $(OBJECTS)
	rm -f $(TARGET).dll $(TARGET).dll.a $(TARGET).def
