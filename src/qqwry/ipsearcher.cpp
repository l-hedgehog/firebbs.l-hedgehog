// ipsearcher.cpp : Defines the entry point for the DLL application.
//
#include "stdafx.h"
#include <windows.h>
#include <stdlib.h> 

extern "C"
{
BOOL WINAPI DllMain(HINSTANCE hinstDLL,DWORD fdwReason,LPVOID lpvReserved);
}

extern "C" __declspec(dllexport) char* __cdecl GetAddress(const char *IPstr);

char *ret[2];
char c[1024], l[512];   //for return
char *ptr = NULL;       //ptr of image
char *p = NULL;         //point to index
unsigned int total;     //ip count

inline unsigned int get_3b(const char *mem)
{
	return 0x00ffffff & *(unsigned int*)(mem);
}

inline void Load(void)
{
	HANDLE hnd;      //file handle
	DWORD NumberOfBytesRead; //len
	char text[2048];  //patch
	char *temp;
	unsigned int len;

	//get patch
	if( !GetModuleFileName(0, text, 2048) )
		return;
	temp = strrchr(text, 92);  // 92 = '\'
	*(temp + 1) = NULL;
	strcat(temp, "QQwry.dat");

	//CreateFile
	hnd = CreateFile(text, GENERIC_READ, FILE_SHARE_READ, NULL, 
		OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
	if(INVALID_HANDLE_VALUE == hnd)
	{
		::MessageBox(NULL, text, "Cannot open file", NULL);
		return;
	}

	//get len
	len = SetFilePointer(hnd, NULL, NULL, FILE_END);
	SetFilePointer(hnd, NULL, NULL, FILE_BEGIN);

	//malloc
	ptr = (char*)malloc(len+9);
	if(!ptr)
	{
		CloseHandle(hnd);
		::MessageBox(NULL, "Cannot allocate memory", NULL, NULL);
		return;
	}

	//read
	if(!ReadFile(hnd, ptr, len, &NumberOfBytesRead, NULL))
	{
		CloseHandle(hnd);
		free(ptr);
		::MessageBox(NULL, text, "Cannot read the file", NULL);
		return;
	}
	CloseHandle(hnd);

	//calc total - 1
	total = (*((unsigned int*)ptr+1) - *(unsigned int*)ptr);

	//check file
	if(total % 7 != 0)
	{
		free(ptr);
		::MessageBox(NULL, text, "QQwry.dat is corrupted", NULL);
		return;
	}

	total /= 7;
	++total;
	p = ptr + *(unsigned int*)ptr;  //ptr of index area
}

inline unsigned int str2ip(const char *lp)
{
	unsigned int ret = 0;
	unsigned int now = 0;

	while(*lp)
	{
		if('.' == *lp)
		{
			ret = 256 * ret + now;
			now = 0;
		}
		else
			now = 10 * now + *lp - '0';
		++lp;
	}

	ret = 256 * ret + now;
	return ret;
}

inline void strcpyn(char *d, const char *s, int len)
{
	while(*s && len > 1)
	{
		*d++ = *s++;
		--len;
	}
	*d = 0x0;
}

char* __cdecl GetAddress(const char *IPstr)
{
	if(NULL == p)
	{
		ret[0] = "Cannot open the data";
		ret[1] = "";
		return ret[0];
	}

	unsigned int ip = str2ip(IPstr);
	char *now_p;

	unsigned int begin = 0, end = total;
	while(1)
	{
		if( begin >= end - 1 )
			break;
		if( ip < *(unsigned int*)(p + (begin + end)/2 * 7) )
			end = (begin + end)/2;
		else
			begin = (begin + end)/2;
 	}

	unsigned int temp = get_3b(p + 7 * begin + 4);
	if(ip <= *(unsigned int*)(ptr + temp)) //ok, found
	{
		now_p = ptr + temp + 4;
		if( 0x01 == *now_p )
			now_p = ptr + get_3b(now_p + 1);
		//country
		if( 0x02 == *now_p ) //jump
		{
			ret[0] = ptr + get_3b(now_p + 1);
			now_p += 4;
		}
		else
		{
			ret[0] = now_p;
			for(; *now_p; ++now_p)
				;
			++now_p;
		}
 		//local
 		if( 0x02 == *now_p ) //jump
			ret[1] = ptr + get_3b(now_p + 1);
		else
			ret[1] = now_p;
	}
 	else
	{
		ret[0] = "Unknown data";
		ret[1] = "";
	}
	strcpyn(c, ret[0], 512);
	strcpyn(l, ret[1], 512);
	strcat(c, l);
	return c;
}
BOOL WINAPI DllMain(HINSTANCE hinstDLL,DWORD fdwReason,LPVOID lpvReserved)
{
	switch(fdwReason)
	{
		//case DLL_THREAD_ATTACH:
		//case DLL_THREAD_DETACH:
		case DLL_PROCESS_ATTACH:  //attach
		{
			Load();
		} 
		break;
		//------------------------------------
		case DLL_PROCESS_DETACH:  //detach
		{
			free(ptr); 
		}
	}
	return true;
}
