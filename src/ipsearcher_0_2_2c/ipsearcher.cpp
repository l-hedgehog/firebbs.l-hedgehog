// 本程序以LGPL(GNU Lesser General Public License)协议发布
// 版本:0.2.2c  版权所有: cnss 2004-2005

// 特别声明: cnss, 作为此代码的作者, 明确地允许您将您的代码
// 静态或动态地链接到ipsearcher. 而不强迫您链接的代码遵循GNU 
// LPGL的条款.但是,任何对ipsearcher中文件的修改或添加都必须遵
// 循GNU LPGL的条款.

#include "stdafx.h"

#include "windows.h"
extern "C"
{
#include "LzmaDecode.h"
BOOL WINAPI DllMain(HINSTANCE hinstDLL,DWORD fdwReason,LPVOID lpvReserved);
}

extern "C" __declspec(dllexport) void*        __cdecl _GetAddress(const char *IPstr);
extern "C" __declspec(dllexport) char*        __cdecl GetAddress(const char *IPstr);
extern "C" __declspec(dllexport) void*        __cdecl GetAddressInt(const unsigned int ip);
extern "C" __declspec(dllexport) unsigned int __cdecl IPCount();
extern "C" __declspec(dllexport) char*        __cdecl DateTime();
extern "C" __declspec(dllexport) bool         __cdecl Reload();

const unsigned char this_ver = 0x03; //本程序版本

char *null_s1 = "未知数据";
char *null_s2 = "";

char *noload_s1 = "未能装载ipwry.dat";
void *noload_result[] = {noload_s1, null_s2};

const unsigned char jump_l_l = 0;
const unsigned char jump_j_l = 1;
const unsigned char jump_l_j = 2;
const unsigned char jump_j_j = 3;
const unsigned char jump_aj  = 4;

const unsigned char jump_l_n = 5;
const unsigned char jump_j_n = 6;
const unsigned char jump_n_l = 7;
const unsigned char jump_n_j = 8;
const unsigned char jump_uk  = 9;

const unsigned char jump_f_l = 10;
const unsigned char jump_f_j = 11;
const unsigned char jump_f_n = 12;
const unsigned char jump_l_f = 13;
const unsigned char jump_j_f = 14;
const unsigned char jump_n_f = 15;


#pragma pack(push, 1)
struct data_header     //1b
{
	unsigned int jump:   4;  //跳转方式
	unsigned int has_child: 1;  //是否有孩子
	unsigned int differ: 3;  //差分类型
};
struct date_time  //4b
{
	unsigned int year:  7; //128
	unsigned int month: 4; //16
	unsigned int day:   5; //32

	unsigned int hour:  5;
	unsigned int min:   6;
	unsigned int sec:   5;
};
struct file_header  //文件头
{
	//基本区  13
	unsigned int  crc;
	unsigned char ver;
	date_time     date;
	unsigned int  total;
	//数据区  5
	unsigned char data_len;  //数据区占几个字节
	unsigned int  data_ptr;  //数据区起始
	//字典   10
	unsigned char dic_len;   //索引占几字节
	unsigned int  dic_count; //字典条目
	unsigned char dic_chr;   //转义字节
	unsigned int  dic_ptr;   //字典区起始
	//压缩  13
	char compress_type;  //压缩算法
	unsigned int compress_begin; //压缩起始
	unsigned int compress_len;   //压缩数据的长度
	unsigned int compress_org;   //原始长度
	//索引区  16
	unsigned int layer1_ptr;
	unsigned int layer1_num;
	unsigned int layer2_ptr;
	unsigned int layer2_num;
};
struct s_index
{
	unsigned int begin;
	unsigned int offset;
};

#pragma pack(pop)

struct ip_info
{
	unsigned int begin, end;
	char *c, *l;
	bool has_child;
};

unsigned int len;       //file len
char *ptr  = 0x0;       //ptr of content
char *data = 0x0;      //数据区
bool loaded = false;    //已装载
file_header *f_header;   //设置用

s_index *layer1_ptr, *layer2_ptr;
unsigned int layer1_num, layer2_num;

char *country, *local;  //查找临时用
char c_text[1024], l_text[512]; //返回用
void *result[] = {c_text, l_text};//返回用

char date_str[32] = ""; //时间

unsigned int dic_len;
unsigned int dic_count;
char dic_chr;
char *dic_ptr;

inline unsigned int _CRC32(const char *buffer, unsigned int len)
{
	static const unsigned int CRC32_Code[] =
	{
		0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA,
			0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
			0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988,
			0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91,
			0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE,
			0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
			0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC,
			0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5,
			0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172,
			0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B,
			0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940,
			0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59,
			0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116,
			0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
			0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924,
			0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,

			0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A,
			0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
			0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818,
			0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01,
			0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E,
			0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457,
			0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C,
			0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65,
			0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2,
			0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB,
			0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0,
			0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9,
			0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086,
			0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F,
			0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4,
			0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD,

			0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A,
			0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683,
			0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8,
			0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1,
			0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE,
			0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7,
			0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC,
			0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5,
			0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252,
			0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B,
			0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60,
			0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79,
			0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236,
			0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F,
			0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04,
			0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D,

			0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A,
			0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713,
			0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38,
			0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21,
			0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E,
			0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777,
			0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C,
			0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45,
			0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2,
			0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB,
			0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0,
			0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9,
			0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6,
			0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF,
			0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94,
			0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D,
	};

	unsigned int  ulCRC(0xffffffff);

	while(len--)
		ulCRC = (ulCRC >> 8) ^ CRC32_Code[(ulCRC & 0xFF) ^ *(unsigned char*)buffer++];

	return ulCRC ^ 0xffffffff;
}

inline unsigned int str2ip(const char *lp)
{
	unsigned int ret = 0;
	unsigned char now = 0;

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

inline bool load_ipwry(void)
{
	HANDLE hnd;
	DWORD NumberOfBytesRead; //len
	char *temp;
	char text[2048];
	
	//路径
	if( !GetModuleFileName(0, text, 2038) )
		return false;
	temp = strrchr(text, 92);  //'\'
	*(temp + 1) = 0x0;
	strcat(temp, "ipwry.dat");
	
	//ipen
	hnd = CreateFile(text, GENERIC_READ, FILE_SHARE_READ, NULL, 
		OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
	if(INVALID_HANDLE_VALUE == hnd)
	{
		::MessageBox(NULL, text, "无法打开文件", NULL);
		return false;
	}
	
	//len
	len = SetFilePointer(hnd, NULL, NULL, FILE_END);
	SetFilePointer(hnd, NULL, NULL, FILE_BEGIN);
	
	//malloc
	ptr = new char[len + 1];
	if(!ptr)
	{
		CloseHandle(hnd);
		::MessageBox(NULL, "无法分配内存", NULL, NULL);
		return false;
	}
	
	//read
	if(!ReadFile(hnd, ptr, len, &NumberOfBytesRead, NULL))
	{
		CloseHandle(hnd);
		delete []ptr;
		ptr = 0x0;
		::MessageBox(NULL, text, "无法读入文件", NULL);
		return false;
	}
	CloseHandle(hnd);

	return true;
}

inline bool init_ipwry()
{
	if(len < sizeof(file_header))
		goto error;

	f_header = (file_header*)ptr;

	if( _CRC32((char*)ptr + 4, len - 4) != f_header->crc )
		goto error;

	if( f_header->ver != this_ver )
	{
		::MessageBox(NULL, "ipwry.dat格式版本与本程序不附.", NULL, NULL);
		return false;
	}

	//解压
	if( 1 == f_header->compress_type )
	{
		unsigned int start = f_header->compress_begin;  //起始位置
		unsigned int org_len = f_header->compress_org; //原大小
		unsigned int now_len  = f_header->compress_len; //现大小
		unsigned int compressed_len, uncompress_len; //处理前后大小

		//新的总大小,内存
		len += org_len - now_len;
		char *decompress = new char[len];

		//有效压缩的大小
		compressed_len = now_len - (LZMA_PROPERTIES_SIZE + 8);

		//读取压缩属性
		unsigned char properties[LZMA_PROPERTIES_SIZE];
		memcpy(properties, ptr+start, LZMA_PROPERTIES_SIZE);

		//设置state
		CLzmaDecoderState state;
		if(LzmaDecodeProperties(&state.Properties, properties, LZMA_PROPERTIES_SIZE) != LZMA_RESULT_OK)
		{
			::MessageBox(NULL, "无法初始化解码器.", NULL, NULL);
			delete []decompress;
			delete []ptr;

			return false;
		}

		//解压
		state.Probs = new CProb[LzmaGetNumProbs(&state.Properties)];
		int c_result;
		c_result = LzmaDecode(&state, (unsigned char*)ptr+start+13, compressed_len, &now_len, 
			(unsigned char*)decompress+start, org_len, &uncompress_len);
		delete []state.Probs;

		//检验
		if(LZMA_RESULT_OK != c_result)
		{
			::MessageBox(NULL, "无法解压数据.", NULL, NULL);
			delete []decompress;
			delete []ptr;

			return false;
		}
		else
		{
			//复制头
			memcpy(decompress, ptr, start);

			//新指针
			delete []ptr;
			ptr = decompress;
			f_header = (file_header*)ptr;
		}
	}

	//数据区
	data = ptr + f_header->data_ptr;

	//字典区
	dic_len   = f_header->dic_len;
	dic_count = f_header->dic_count;
	dic_chr   = f_header->dic_chr;
	dic_ptr   = ptr + f_header->dic_ptr;

	//层
	layer1_ptr = (s_index*)(ptr + f_header->layer1_ptr);
	layer1_num = f_header->layer1_num;
	layer2_ptr = (s_index*)(ptr + f_header->layer2_ptr);
	layer2_num = f_header->layer2_num;

	//时间
	wsprintf(date_str, "%04d-%02d-%02d %02d:%02d:%02d", f_header->date.year + 2000,
		f_header->date.month,
		f_header->date.day,
		f_header->date.hour,
		f_header->date.min,
		2 * f_header->date.sec
		);

	loaded = true;
	return true;

error:
	::MessageBox(NULL, "IPwry.dat文件已损坏,请重新下载.", NULL, NULL);
	return false;
}
inline void get_ip_info(ip_info &info, const s_index *t_index)
{
	//数据区
	char *t_data_ptr = data + (t_index->offset & 0x00FFFFFF);

	//header
	data_header *d_header = (data_header*)t_data_ptr;

	//起始IP
	info.begin = t_index->begin;

	//结束IP
	unsigned int endip = *(unsigned int*)(t_data_ptr + 1);
	if(0 == d_header->differ)
		endip = 0;
	else if(1 == d_header->differ)
		endip &= 0x000000FF;
	else if(2 == d_header->differ)
		endip &= 0x0000FFFF;
	else if(3 == d_header->differ)
		endip &= 0x00FFFFFF;

	info.end = info.begin + endip;

	//是否还有
	info.has_child = d_header->has_child;

	//国家,地区
	char *p = t_data_ptr + 1 + d_header->differ; //指向国家,地区

	if(jump_aj == d_header->jump) //全跳
	{
		t_data_ptr = data + (0x00FFFFFF & *(unsigned int*)p);  //新数据区
		d_header = (data_header*)t_data_ptr;                   //新头

		p = t_data_ptr + 1 + d_header->differ; //指向国家,地区
	}

	switch(d_header->jump)
	{
	case jump_f_j:  //父, 跳
		info.c = country;
		info.l = data + (*(unsigned int*)p & 0x00FFFFFF);
		break;
	case jump_f_l:  //父, 原
		info.c = country;
		info.l = p;
		break;
	case jump_f_n:  //父, 无
		info.c = country;
		info.l = "";
		break;
	case jump_j_f:  //跳, 父
		info.c = data + (*(unsigned int*)p & 0x00FFFFFF);
		info.l = local;
		break;
	case jump_l_f:  //原, 父
		info.c = p;
		info.l = local;
		break;
	case jump_n_f:  //无, 父
		info.c = "";
		info.l = local;
		break;

	case jump_j_j:  //跳, 跳
		info.c = data + (*(unsigned int*)p & 0x00FFFFFF);
		info.l = data + (*(unsigned int*)(p+3) & 0x00FFFFFF);
		break;
	case jump_j_l:  //跳, 原
		info.c = data + (*(unsigned int*)p & 0x00FFFFFF);
		info.l = p + 3;
		break;
	case jump_j_n:  //跳, 无
		info.c = data + (*(unsigned int*)p & 0x00FFFFFF);
		info.l = "";
		break;
	case jump_l_j:  //原, 跳
		info.c = p;
		info.l = data + (*(unsigned int*)(p + strlen(p) + 1) & 0x00FFFFFF);
		break;
	case jump_l_l:  //原, 原
		info.c = p;
		info.l = p + strlen(p) + 1;
		break;
	case jump_l_n:  //原, 无
		info.c = p;
		info.l = "";
		break;
	case jump_n_j:  //无, 跳
		info.c = "";
		info.l = data + (*(unsigned int*)p & 0x00FFFFFF);
		break;
	case jump_n_l:  //无, 原
		info.c = "";
		info.l = p;
		break;
	case jump_uk:   //未知
	default:
		info.c = null_s1;
		info.l = null_s2;
	}
}

inline void decode()
{
	strcpyn(c_text, country, 512);
	strcpyn(l_text, local, 512);
}
inline void get_ipwry(const unsigned int ip)
{
	//重置
	country = null_s1;
	local = null_s2;

	ip_info info;
	unsigned int beg, end;
	s_index* tt;

	//layer1======================================
	beg = 0;
	end = layer1_num;
	tt = (s_index*)( (char*)layer1_ptr + end * 7);

	//最后一个
	get_ip_info(info, tt);
	if( ip > info.end )  
		goto layer2;

	++end;
	while(1)
	{
		if( beg >= end - 1 )  //找到
			break;
		if( ip < ((s_index*)((char*)layer1_ptr + (beg + end)/2 * 7))->begin )
			end = (beg + end) / 2;
		else
			beg = (beg + end) / 2;
	}

	get_ip_info( info, (s_index*)((char*)layer1_ptr + beg*7) );
	if(ip <= info.end)  //加入
	{
		country = info.c;
		local   = info.l;

		if( !info.has_child )
			goto do_decode;
	}

	//layer2======================================
layer2:
	beg = 0;
	end = layer2_num;
	tt = (s_index*)( (char*)layer2_ptr + end * 7);

	//最后一个
	get_ip_info(info, tt);
	if( ip > info.end )
		goto do_decode;

	++end;
	while(1)
	{
		if( beg >= end - 1 )  //找到
			break;
		if( ip < ((s_index*)((char*)layer2_ptr + (beg + end)/2 * 7))->begin )
			end = (beg + end) / 2;
		else
			beg = (beg + end) / 2;
	}

	get_ip_info( info, (s_index*)((char*)layer2_ptr + beg*7) );
	if(ip <= info.end)  //加入
	{
		country = info.c;
		local   = info.l;
	}

do_decode:
	decode();
}

void* __cdecl _GetAddress(const char *IPstr)
{
	if( !loaded || !ptr )
		return noload_result;

	unsigned int ip = str2ip(IPstr);
	get_ipwry(ip);

	return result;
}

char* __cdecl GetAddress(const char *IPstr)
{
	if( !loaded || !ptr )
		return noload_s1;

	unsigned int ip = str2ip(IPstr);
	get_ipwry(ip);

	strcat(c_text, l_text);
	return c_text;
}

void* __cdecl GetAddressInt(const unsigned int ip)
{
	if( !loaded || !ptr )
		return noload_result;

	get_ipwry(ip);

	return result;
}

unsigned int __cdecl IPCount()
{
	if( !loaded )
		return 0;
	return f_header->total;
}

char* __cdecl DateTime()
{
	if( !loaded )
		return noload_s1;
	return date_str;
}

bool __cdecl Reload()
{
	loaded = false;

	if( 0x0 != ptr)
		delete []ptr;

	if( !load_ipwry() )
		return false;
    
	return init_ipwry();
}

BOOL WINAPI DllMain(HINSTANCE hinstDLL,DWORD fdwReason,LPVOID lpvReserved)
{
	switch(fdwReason)
	{
		//case DLL_THREAD_ATTACH:
		//case DLL_THREAD_DETACH:
	case DLL_PROCESS_ATTACH:  //attach
		{
			if( load_ipwry() )
				init_ipwry();
		} 
		break;
		//------------------------------------
	case DLL_PROCESS_DETACH:  //detach
		{
			if( ptr )
				delete []ptr;
		}
		break;
	}
	return true;
}
