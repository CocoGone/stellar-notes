// 历史同盘的人物库：由 side-session-notes 里的 build-people.mjs 用 iztro 2.6.1 排盘生成，不要手改盘面字段。
// 收录规则：出生日期和时辰有记录可查；去世 50 年以上；不收在世的人、不收近现代政治人物。出生资料上线前逐条核对原始记录。
// 1582 年前的日期按儒略历；中国人物按农历输入。

export interface Person {
  name: string;
  /** 卡片上的印章字 */
  seal: string;
  years: string;
  who: string;
  born: string;
  src: string;
  ming: { branch: string; stars: { name: string; brightness?: string; siHua?: string }[] };
  /** 身宫落在哪一宫 */
  shen: string;
  bazi: string;
}

export const PEOPLE: Person[] = [
  {
    "name": "唐寅（唐伯虎）",
    "seal": "唐",
    "years": "1470–1524",
    "who": "明代画家、文学家",
    "born": "明成化六年二月初四寅时（1470 年 3 月 6 日），苏州",
    "src": "生日见于传世记载；寅时出自民间\"寅年寅月寅日寅时\"之说",
    "ming": {
      "branch": "丑",
      "stars": [
        {
          "name": "太阳",
          "brightness": "不",
          "siHua": "禄"
        },
        {
          "name": "太阴",
          "brightness": "庙",
          "siHua": "科"
        }
      ]
    },
    "shen": "官禄宫",
    "bazi": "庚寅 己卯 癸丑 甲寅"
  },
  {
    "name": "苏轼",
    "seal": "苏",
    "years": "1037–1101",
    "who": "北宋文学家",
    "born": "北宋景祐三年十二月十九日卯时（1037 年 1 月 8 日），眉州眉山",
    "src": "传世八字",
    "ming": {
      "branch": "戌",
      "stars": [
        {
          "name": "紫微",
          "brightness": "得"
        },
        {
          "name": "天相",
          "brightness": "得"
        }
      ]
    },
    "shen": "迁移宫",
    "bazi": "丙子 辛丑 癸亥 乙卯"
  },
  {
    "name": "朱元璋",
    "seal": "朱",
    "years": "1328–1398",
    "who": "明朝开国皇帝",
    "born": "元天历元年九月十八日未时（1328 年 10 月 21 日），濠州钟离",
    "src": "传世八字",
    "ming": {
      "branch": "卯",
      "stars": []
    },
    "shen": "福德宫",
    "bazi": "戊辰 壬戌 丁丑 丁未"
  },
  {
    "name": "王阳明",
    "seal": "王",
    "years": "1472–1529",
    "who": "明代思想家",
    "born": "明成化八年九月三十日亥时（1472 年 10 月 31 日），余姚",
    "src": "传世八字",
    "ming": {
      "branch": "亥",
      "stars": [
        {
          "name": "紫微",
          "brightness": "旺",
          "siHua": "权"
        },
        {
          "name": "七杀",
          "brightness": "平"
        }
      ]
    },
    "shen": "夫妻宫",
    "bazi": "壬辰 庚戌 癸亥 癸亥"
  },
  {
    "name": "岳飞",
    "seal": "岳",
    "years": "1103–1142",
    "who": "南宋抗金名将",
    "born": "北宋崇宁二年二月十五日巳时（1103 年 3 月 24 日），相州汤阴",
    "src": "传世八字",
    "ming": {
      "branch": "戌",
      "stars": [
        {
          "name": "贪狼",
          "brightness": "庙",
          "siHua": "忌"
        }
      ]
    },
    "shen": "夫妻宫",
    "bazi": "癸未 乙卯 甲子 己巳"
  },
  {
    "name": "朱熹",
    "seal": "熹",
    "years": "1130–1200",
    "who": "南宋理学家",
    "born": "南宋建炎四年九月十五日午时（1130 年 10 月 18 日），尤溪",
    "src": "传世八字",
    "ming": {
      "branch": "辰",
      "stars": [
        {
          "name": "紫微",
          "brightness": "得"
        },
        {
          "name": "天相",
          "brightness": "得"
        }
      ]
    },
    "shen": "命宫",
    "bazi": "庚戌 丙戌 甲寅 庚午"
  },
  {
    "name": "张居正",
    "seal": "张",
    "years": "1525–1582",
    "who": "明代内阁首辅",
    "born": "明嘉靖四年五月初三寅时（1525 年 5 月 24 日），江陵",
    "src": "传世八字",
    "ming": {
      "branch": "辰",
      "stars": [
        {
          "name": "太阴",
          "brightness": "陷",
          "siHua": "忌"
        }
      ]
    },
    "shen": "官禄宫",
    "bazi": "乙酉 壬午 辛酉 庚寅"
  },
  {
    "name": "康熙",
    "seal": "康",
    "years": "1654–1722",
    "who": "清朝皇帝",
    "born": "清顺治十一年三月十八日巳时（1654 年 5 月 4 日），北京",
    "src": "传世八字",
    "ming": {
      "branch": "亥",
      "stars": [
        {
          "name": "天同",
          "brightness": "庙"
        }
      ]
    },
    "shen": "夫妻宫",
    "bazi": "甲午 戊辰 戊申 丁巳"
  },
  {
    "name": "雍正",
    "seal": "雍",
    "years": "1678–1735",
    "who": "清朝皇帝",
    "born": "清康熙十七年十月三十日寅时（1678 年 12 月 13 日），北京",
    "src": "传世八字",
    "ming": {
      "branch": "酉",
      "stars": [
        {
          "name": "天相",
          "brightness": "陷"
        }
      ]
    },
    "shen": "官禄宫",
    "bazi": "戊午 癸亥 丁酉 壬寅"
  },
  {
    "name": "乾隆",
    "seal": "乾",
    "years": "1711–1799",
    "who": "清朝皇帝",
    "born": "清康熙五十年八月十三日子时（1711 年 9 月 25 日），北京",
    "src": "传世八字",
    "ming": {
      "branch": "酉",
      "stars": [
        {
          "name": "天相",
          "brightness": "陷"
        }
      ]
    },
    "shen": "命宫",
    "bazi": "辛卯 丁酉 庚午 丙子"
  },
  {
    "name": "约翰内斯·开普勒",
    "seal": "开",
    "years": "1571–1630",
    "who": "德国天文学家，行星运动定律的发现者",
    "born": "1571 年 12 月 27 日 14:30（儒略历，未时），魏尔",
    "src": "本人亲手排的星盘",
    "ming": {
      "branch": "午",
      "stars": [
        {
          "name": "天梁",
          "brightness": "庙"
        }
      ]
    },
    "shen": "福德宫",
    "bazi": "辛未 辛丑 己亥 辛未"
  },
  {
    "name": "沃尔夫冈·莫扎特",
    "seal": "莫",
    "years": "1756–1791",
    "who": "奥地利作曲家",
    "born": "1756 年 1 月 27 日 20:00（戌时），萨尔茨堡",
    "src": "出生登记",
    "ming": {
      "branch": "卯",
      "stars": [
        {
          "name": "廉贞",
          "brightness": "平"
        },
        {
          "name": "破军",
          "brightness": "陷"
        }
      ]
    },
    "shen": "财帛宫",
    "bazi": "乙亥 己丑 乙丑 丙戌"
  },
  {
    "name": "约翰·沃尔夫冈·冯·歌德",
    "seal": "歌",
    "years": "1749–1832",
    "who": "德国作家",
    "born": "1749 年 8 月 28 日 12:00（午时），法兰克福",
    "src": "出生登记",
    "ming": {
      "branch": "寅",
      "stars": [
        {
          "name": "武曲",
          "brightness": "得",
          "siHua": "禄"
        },
        {
          "name": "天相",
          "brightness": "庙"
        }
      ]
    },
    "shen": "命宫",
    "bazi": "己巳 壬申 壬戌 丙午"
  },
  {
    "name": "奥诺雷·德·巴尔扎克",
    "seal": "巴",
    "years": "1799–1850",
    "who": "法国作家",
    "born": "1799 年 5 月 20 日 11:00（午时），法国图尔",
    "src": "出生登记",
    "ming": {
      "branch": "亥",
      "stars": [
        {
          "name": "太阴",
          "brightness": "庙"
        }
      ]
    },
    "shen": "命宫",
    "bazi": "己未 己巳 甲辰 庚午"
  },
  {
    "name": "维克多·雨果",
    "seal": "雨",
    "years": "1802–1885",
    "who": "法国作家",
    "born": "1802 年 2 月 26 日 22:30（亥时），法国贝桑松",
    "src": "出生登记",
    "ming": {
      "branch": "卯",
      "stars": [
        {
          "name": "武曲",
          "brightness": "利",
          "siHua": "忌"
        },
        {
          "name": "七杀",
          "brightness": "旺"
        }
      ]
    },
    "shen": "夫妻宫",
    "bazi": "壬戌 壬寅 丙申 己亥"
  },
  {
    "name": "大仲马",
    "seal": "仲",
    "years": "1802–1870",
    "who": "法国作家",
    "born": "1802 年 7 月 24 日 05:30（卯时），法国维莱科特雷",
    "src": "出生登记",
    "ming": {
      "branch": "辰",
      "stars": [
        {
          "name": "太阴",
          "brightness": "陷"
        }
      ]
    },
    "shen": "迁移宫",
    "bazi": "壬戌 丁未 甲子 丁卯"
  },
  {
    "name": "理查德·瓦格纳",
    "seal": "瓦",
    "years": "1813–1883",
    "who": "德国作曲家",
    "born": "1813 年 5 月 22 日 04:00（寅时），莱比锡",
    "src": "出生登记",
    "ming": {
      "branch": "卯",
      "stars": []
    },
    "shen": "官禄宫",
    "bazi": "癸酉 丁巳 己未 丙寅"
  },
  {
    "name": "夏尔·波德莱尔",
    "seal": "波",
    "years": "1821–1867",
    "who": "法国诗人",
    "born": "1821 年 4 月 9 日 15:00（申时），巴黎",
    "src": "出生登记",
    "ming": {
      "branch": "申",
      "stars": []
    },
    "shen": "官禄宫",
    "bazi": "辛巳 壬辰 戊午 庚申"
  },
  {
    "name": "居斯塔夫·福楼拜",
    "seal": "福",
    "years": "1821–1880",
    "who": "法国作家",
    "born": "1821 年 12 月 12 日 04:00（寅时），法国鲁昂",
    "src": "出生登记",
    "ming": {
      "branch": "戌",
      "stars": [
        {
          "name": "太阴",
          "brightness": "旺"
        }
      ]
    },
    "shen": "官禄宫",
    "bazi": "辛巳 庚子 乙丑 戊寅"
  },
  {
    "name": "路易·巴斯德",
    "seal": "斯",
    "years": "1822–1895",
    "who": "法国微生物学家",
    "born": "1822 年 12 月 27 日 02:00（丑时），法国多勒",
    "src": "出生登记",
    "ming": {
      "branch": "亥",
      "stars": [
        {
          "name": "天同",
          "brightness": "庙"
        }
      ]
    },
    "shen": "福德宫",
    "bazi": "壬午 壬子 乙酉 丁丑"
  },
  {
    "name": "儒勒·凡尔纳",
    "seal": "凡",
    "years": "1828–1905",
    "who": "法国作家，《海底两万里》作者",
    "born": "1828 年 2 月 8 日 12:00（午时），法国南特",
    "src": "出生登记",
    "ming": {
      "branch": "未",
      "stars": [
        {
          "name": "天同",
          "brightness": "不",
          "siHua": "权"
        },
        {
          "name": "巨门",
          "brightness": "不",
          "siHua": "忌"
        }
      ]
    },
    "shen": "命宫",
    "bazi": "丁亥 癸丑 甲午 庚午"
  },
  {
    "name": "刘易斯·卡罗尔",
    "seal": "卡",
    "years": "1832–1898",
    "who": "英国作家，《爱丽丝梦游仙境》作者",
    "born": "1832 年 1 月 27 日 03:48（寅时），英国达斯伯里",
    "src": "出生登记",
    "ming": {
      "branch": "亥",
      "stars": [
        {
          "name": "天机",
          "brightness": "平"
        }
      ]
    },
    "shen": "官禄宫",
    "bazi": "辛卯 辛丑 癸卯 甲寅"
  },
  {
    "name": "约翰内斯·勃拉姆斯",
    "seal": "勃",
    "years": "1833–1897",
    "who": "德国作曲家",
    "born": "1833 年 5 月 7 日 03:30（寅时），汉堡",
    "src": "出生登记",
    "ming": {
      "branch": "寅",
      "stars": [
        {
          "name": "廉贞",
          "brightness": "庙"
        }
      ]
    },
    "shen": "官禄宫",
    "bazi": "癸巳 丙辰 己丑 丙寅"
  },
  {
    "name": "保罗·塞尚",
    "seal": "塞",
    "years": "1839–1906",
    "who": "法国画家",
    "born": "1839 年 1 月 19 日 01:00（丑时），法国艾克斯",
    "src": "出生登记",
    "ming": {
      "branch": "子",
      "stars": [
        {
          "name": "紫微",
          "brightness": "平"
        }
      ]
    },
    "shen": "福德宫",
    "bazi": "戊戌 乙丑 壬申 辛丑"
  },
  {
    "name": "奥古斯特·罗丹",
    "seal": "罗",
    "years": "1840–1917",
    "who": "法国雕塑家",
    "born": "1840 年 11 月 12 日 12:00（午时），巴黎",
    "src": "出生登记",
    "ming": {
      "branch": "巳",
      "stars": [
        {
          "name": "紫微",
          "brightness": "旺"
        },
        {
          "name": "七杀",
          "brightness": "平"
        }
      ]
    },
    "shen": "命宫",
    "bazi": "庚子 丁亥 乙亥 壬午"
  },
  {
    "name": "埃米尔·左拉",
    "seal": "左",
    "years": "1840–1902",
    "who": "法国作家",
    "born": "1840 年 4 月 2 日 23:00（子时），巴黎",
    "src": "出生登记",
    "ming": {
      "branch": "辰",
      "stars": [
        {
          "name": "紫微",
          "brightness": "得"
        },
        {
          "name": "天相",
          "brightness": "得"
        }
      ]
    },
    "shen": "命宫",
    "bazi": "庚子 庚辰 壬辰 庚子"
  },
  {
    "name": "皮埃尔-奥古斯特·雷诺阿",
    "seal": "雷",
    "years": "1841–1919",
    "who": "法国画家",
    "born": "1841 年 2 月 25 日 06:00（卯时），法国利摩日",
    "src": "出生登记",
    "ming": {
      "branch": "子",
      "stars": [
        {
          "name": "破军",
          "brightness": "庙"
        }
      ]
    },
    "shen": "迁移宫",
    "bazi": "辛丑 辛卯 庚申 己卯"
  },
  {
    "name": "弗里德里希·尼采",
    "seal": "尼",
    "years": "1844–1900",
    "who": "德国哲学家",
    "born": "1844 年 10 月 15 日 10:00（巳时），德国勒肯",
    "src": "出生登记",
    "ming": {
      "branch": "巳",
      "stars": [
        {
          "name": "紫微",
          "brightness": "旺"
        },
        {
          "name": "七杀",
          "brightness": "平"
        }
      ]
    },
    "shen": "夫妻宫",
    "bazi": "甲辰 甲戌 戊辰 丁巳"
  },
  {
    "name": "亚历山大·格拉汉姆·贝尔",
    "seal": "贝",
    "years": "1847–1922",
    "who": "发明家，电话的发明者",
    "born": "1847 年 3 月 3 日 07:00（辰时），爱丁堡",
    "src": "出生登记",
    "ming": {
      "branch": "戌",
      "stars": [
        {
          "name": "天同",
          "brightness": "平",
          "siHua": "权"
        }
      ]
    },
    "shen": "财帛宫",
    "bazi": "丁未 壬寅 丁酉 甲辰"
  },
  {
    "name": "保罗·高更",
    "seal": "高",
    "years": "1848–1903",
    "who": "法国画家",
    "born": "1848 年 6 月 7 日 10:00（巳时），巴黎",
    "src": "出生登记",
    "ming": {
      "branch": "丑",
      "stars": [
        {
          "name": "天机",
          "brightness": "陷",
          "siHua": "忌"
        }
      ]
    },
    "shen": "夫妻宫",
    "bazi": "戊申 戊午 己卯 己巳"
  },
  {
    "name": "罗伯特·路易斯·史蒂文森",
    "seal": "史",
    "years": "1850–1894",
    "who": "苏格兰作家，《金银岛》作者",
    "born": "1850 年 11 月 13 日 13:30（未时），爱丁堡",
    "src": "出生登记",
    "ming": {
      "branch": "辰",
      "stars": [
        {
          "name": "七杀",
          "brightness": "庙"
        }
      ]
    },
    "shen": "福德宫",
    "bazi": "庚戌 丁亥 戊辰 己未"
  },
  {
    "name": "文森特·梵高",
    "seal": "梵",
    "years": "1853–1890",
    "who": "荷兰画家",
    "born": "1853 年 3 月 30 日 11:00（午时），荷兰津德尔特",
    "src": "出生登记",
    "ming": {
      "branch": "酉",
      "stars": [
        {
          "name": "太阴",
          "brightness": "旺",
          "siHua": "科"
        }
      ]
    },
    "shen": "命宫",
    "bazi": "癸丑 乙卯 丙申 甲午"
  },
  {
    "name": "奥斯卡·王尔德",
    "seal": "尔",
    "years": "1854–1900",
    "who": "爱尔兰作家",
    "born": "1854 年 10 月 16 日 03:00（寅时），都柏林",
    "src": "出生登记",
    "ming": {
      "branch": "未",
      "stars": []
    },
    "shen": "官禄宫",
    "bazi": "甲寅 癸酉 辛酉 庚寅"
  },
  {
    "name": "西格蒙德·弗洛伊德",
    "seal": "弗",
    "years": "1856–1939",
    "who": "奥地利心理学家，精神分析学创始人",
    "born": "1856 年 5 月 6 日 18:30（酉时），摩拉维亚弗莱堡（今捷克普日博尔）",
    "src": "出生登记",
    "ming": {
      "branch": "申",
      "stars": [
        {
          "name": "太阳",
          "brightness": "得"
        },
        {
          "name": "巨门",
          "brightness": "庙"
        }
      ]
    },
    "shen": "迁移宫",
    "bazi": "丙辰 癸巳 己丑 癸酉"
  },
  {
    "name": "尼古拉·特斯拉",
    "seal": "特",
    "years": "1856–1943",
    "who": "发明家",
    "born": "1856 年 7 月 10 日 00:00（子时），斯米良",
    "src": "出生登记",
    "ming": {
      "branch": "未",
      "stars": [
        {
          "name": "天相",
          "brightness": "得"
        }
      ]
    },
    "shen": "命宫",
    "bazi": "丙辰 乙未 甲午 甲子"
  },
  {
    "name": "阿瑟·柯南·道尔",
    "seal": "柯",
    "years": "1859–1930",
    "who": "英国作家，福尔摩斯的作者",
    "born": "1859 年 5 月 22 日 04:55（寅时），爱丁堡",
    "src": "出生登记",
    "ming": {
      "branch": "卯",
      "stars": []
    },
    "shen": "官禄宫",
    "bazi": "己未 己巳 庚申 戊寅"
  },
  {
    "name": "克劳德·德彪西",
    "seal": "德",
    "years": "1862–1918",
    "who": "法国作曲家",
    "born": "1862 年 8 月 22 日 04:30（寅时），法国圣日耳曼昂莱",
    "src": "出生登记",
    "ming": {
      "branch": "午",
      "stars": [
        {
          "name": "廉贞",
          "brightness": "平"
        },
        {
          "name": "天相",
          "brightness": "庙"
        }
      ]
    },
    "shen": "官禄宫",
    "bazi": "壬戌 戊申 戊申 甲寅"
  },
  {
    "name": "亨利·德·图卢兹-劳特累克",
    "seal": "劳",
    "years": "1864–1901",
    "who": "法国画家",
    "born": "1864 年 11 月 24 日 06:00（卯时），法国阿尔比",
    "src": "出生登记",
    "ming": {
      "branch": "申",
      "stars": [
        {
          "name": "贪狼",
          "brightness": "平"
        }
      ]
    },
    "shen": "迁移宫",
    "bazi": "甲子 乙亥 癸巳 乙卯"
  },
  {
    "name": "亨利·马蒂斯",
    "seal": "马",
    "years": "1869–1954",
    "who": "法国画家",
    "born": "1869 年 12 月 31 日 20:00（戌时），法国勒卡托",
    "src": "出生登记",
    "ming": {
      "branch": "寅",
      "stars": [
        {
          "name": "太阳",
          "brightness": "旺"
        },
        {
          "name": "巨门",
          "brightness": "庙"
        }
      ]
    },
    "shen": "财帛宫",
    "bazi": "己巳 丙子 丙申 戊戌"
  },
  {
    "name": "马塞尔·普鲁斯特",
    "seal": "普",
    "years": "1871–1922",
    "who": "法国作家",
    "born": "1871 年 7 月 10 日 23:30（子时），巴黎",
    "src": "出生登记",
    "ming": {
      "branch": "午",
      "stars": [
        {
          "name": "天机",
          "brightness": "庙"
        }
      ]
    },
    "shen": "命宫",
    "bazi": "辛未 甲午 癸丑 壬子"
  },
  {
    "name": "托马斯·曼",
    "seal": "曼",
    "years": "1875–1955",
    "who": "德国作家",
    "born": "1875 年 6 月 6 日 10:15（巳时），吕贝克",
    "src": "出生登记",
    "ming": {
      "branch": "丑",
      "stars": []
    },
    "shen": "夫妻宫",
    "bazi": "乙亥 壬午 己亥 己巳"
  },
  {
    "name": "卡尔·荣格",
    "seal": "荣",
    "years": "1875–1961",
    "who": "瑞士心理学家",
    "born": "1875 年 7 月 26 日 19:32（戌时），瑞士凯斯维尔",
    "src": "出生登记",
    "ming": {
      "branch": "酉",
      "stars": [
        {
          "name": "武曲",
          "brightness": "利"
        },
        {
          "name": "七杀",
          "brightness": "旺"
        }
      ]
    },
    "shen": "财帛宫",
    "bazi": "乙亥 癸未 己丑 甲戌"
  },
  {
    "name": "莱纳·玛利亚·里尔克",
    "seal": "里",
    "years": "1875–1926",
    "who": "奥地利诗人",
    "born": "1875 年 12 月 4 日 23:50（子时），布拉格",
    "src": "出生登记",
    "ming": {
      "branch": "子",
      "stars": [
        {
          "name": "巨门",
          "brightness": "旺"
        }
      ]
    },
    "shen": "命宫",
    "bazi": "乙亥 戊子 辛丑 戊子"
  },
  {
    "name": "莫里斯·拉威尔",
    "seal": "拉",
    "years": "1875–1937",
    "who": "法国作曲家",
    "born": "1875 年 3 月 7 日 22:00（亥时），法国西布勒",
    "src": "出生登记",
    "ming": {
      "branch": "卯",
      "stars": [
        {
          "name": "武曲",
          "brightness": "利"
        },
        {
          "name": "七杀",
          "brightness": "旺"
        }
      ]
    },
    "shen": "夫妻宫",
    "bazi": "乙亥 戊寅 戊辰 癸亥"
  },
  {
    "name": "赫尔曼·黑塞",
    "seal": "黑",
    "years": "1877–1962",
    "who": "德语作家",
    "born": "1877 年 7 月 2 日 18:30（酉时），德国卡尔夫",
    "src": "出生登记",
    "ming": {
      "branch": "酉",
      "stars": []
    },
    "shen": "迁移宫",
    "bazi": "丁丑 丙午 丙子 丁酉"
  },
  {
    "name": "阿尔伯特·爱因斯坦",
    "seal": "爱",
    "years": "1879–1955",
    "who": "物理学家",
    "born": "1879 年 3 月 14 日 11:30（午时），德国乌尔姆",
    "src": "出生登记",
    "ming": {
      "branch": "酉",
      "stars": [
        {
          "name": "紫微",
          "brightness": "旺"
        },
        {
          "name": "贪狼",
          "brightness": "利",
          "siHua": "权"
        }
      ]
    },
    "shen": "命宫",
    "bazi": "己卯 丁卯 丙申 甲午"
  }
];
