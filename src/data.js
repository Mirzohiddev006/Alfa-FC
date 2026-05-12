// Mock data for Alpha FC CIMS
// Realistic Uzbek names, dates, sums in so'm

export const MOCK = (function () {
  const firstNames = ['Ali', 'Bekzod', 'Doniyor', 'Elyor', 'Farrux', 'Sherzod', 'Javohir', 'Sardor', 'Otabek', 'Aziz', 'Rustam', 'Anvar', 'Sanjar', 'Bobur', 'Jasur', 'Diyor', 'Akmal', 'Asadbek', 'Hasan', 'Husan', 'Komil', 'Laziz', 'Mirzo', 'Nodir', 'Oybek', 'Polat', 'Rahim', 'Said', 'Temur', 'Ulugʼbek', 'Vohid', 'Yusuf', 'Zafar'];
  const lastNames = ['Karimov', 'Toshmatov', 'Yusupov', 'Aliyev', 'Rahimov', 'Saidov', 'Tursunov', 'Xolmatov', 'Nazarov', 'Mirzayev', 'Qodirov', 'Ergashev', 'Hamidov', 'Ibrohimov', 'Joʼrayev', 'Komilov', 'Latipov', 'Mahmudov', 'Norov', 'Olimov', 'Pulatov', 'Rashidov'];

  function pad(n) { return String(n).padStart(2, '0'); }

  let _seed = 42;
  function srand() {
    _seed = (_seed * 9301 + 49297) % 233280;
    return _seed / 233280;
  }
  function spick(arr) { return arr[Math.floor(srand() * arr.length)]; }
  function sint(a, b) { return a + Math.floor(srand() * (b - a + 1)); }

  const groups = [
    { id: 1, name: 'Yoshlar U-10 / A', identifier: 'A1', birth_year: 2016, capacity: 22, coach_id: 4, coach_name: 'Otabek Mirzayev', status: 'active', students_count: 19 },
    { id: 2, name: 'Yoshlar U-10 / B', identifier: 'A2', birth_year: 2016, capacity: 22, coach_id: 5, coach_name: 'Sardor Tursunov', status: 'active', students_count: 22 },
    { id: 3, name: 'Yoshlar U-11', identifier: 'B1', birth_year: 2015, capacity: 24, coach_id: 4, coach_name: 'Otabek Mirzayev', status: 'active', students_count: 21 },
    { id: 4, name: 'Yoshlar U-12 / A', identifier: 'C1', birth_year: 2014, capacity: 24, coach_id: 6, coach_name: 'Bekzod Karimov', status: 'active', students_count: 24 },
    { id: 5, name: 'Yoshlar U-12 / B', identifier: 'C2', birth_year: 2014, capacity: 24, coach_id: 6, coach_name: 'Bekzod Karimov', status: 'active', students_count: 18 },
    { id: 6, name: 'Oʼsmirlar U-14', identifier: 'D1', birth_year: 2012, capacity: 26, coach_id: 7, coach_name: 'Jasur Qodirov', status: 'active', students_count: 23 },
    { id: 7, name: 'Oʼsmirlar U-15', identifier: 'D2', birth_year: 2011, capacity: 26, coach_id: 7, coach_name: 'Jasur Qodirov', status: 'active', students_count: 25 },
    { id: 8, name: 'Kattalar U-17', identifier: 'E1', birth_year: 2009, capacity: 28, coach_id: 8, coach_name: 'Rustam Aliyev', status: 'active', students_count: 26 },
  ];

  const students = [];
  for (let i = 1; i <= 84; i++) {
    const g = spick(groups);
    const by = g.birth_year + sint(-1, 1);
    const first = spick(firstNames);
    const last = spick(lastNames);
    const m = sint(1, 12), d = sint(1, 28);
    students.push({
      id: i,
      first_name: first,
      last_name: last,
      full_name: first + ' ' + last,
      date_of_birth: by + '-' + pad(m) + '-' + pad(d),
      birth_year: by,
      age: 2026 - by,
      height: sint(120, 175),
      weight: sint(25, 65),
      pnfl: '5' + String(sint(10000000000000, 99999999999999)).slice(0, 13),
      phone: '+99890' + sint(1000000, 9999999),
      address: spick(['Toshkent sh., Chilonzor t.', 'Toshkent sh., Yashnobod t.', 'Toshkent sh., Mirzo Ulugʼbek t.', 'Toshkent sh., Yunusobod t.', 'Toshkent sh., Olmazor t.', 'Toshkent vil., Qibray t.']),
      millati: spick(['Oʼzbek', 'Oʼzbek', 'Oʼzbek', 'Rus', 'Qozoq', 'Tojik']),
      ampula: spick(['O(+)', 'A(+)', 'B(+)', 'AB(+)', 'O(-)', 'A(-)']),
      status: srand() < 0.86 ? 'active' : (srand() < 0.5 ? 'inactive' : 'archived'),
      group_id: g.id,
      group_name: g.name,
      coach_name: g.coach_name,
      monthly_fee: spick([450000, 500000, 550000, 600000]),
      avatar_color: spick(['#C8202C', '#0F1F4D', '#F5B921', '#3E5C76', '#7A1F2B', '#1B3A6F']),
      attendance_rate: sint(72, 99),
      joined: '2024-' + pad(sint(1, 12)) + '-' + pad(sint(1, 28)),
    });
  }

  const users = [
    { id: 1, full_name: 'Akmal Yusupov', phone: '+998901112233', email: 'akmal@alphafc.uz', role: 'Super Admin', status: 'active', is_super_admin: true, last_login: '2026-05-11 09:14' },
    { id: 2, full_name: 'Doniyor Saidov', phone: '+998901112244', email: 'doniyor@alphafc.uz', role: 'Director', status: 'active', is_super_admin: false, last_login: '2026-05-11 08:02' },
    { id: 3, full_name: 'Munira Rahimova', phone: '+998901112255', email: 'munira@alphafc.uz', role: 'Accountant', status: 'active', is_super_admin: false, last_login: '2026-05-10 17:40' },
    { id: 4, full_name: 'Otabek Mirzayev', phone: '+998901112266', email: 'otabek@alphafc.uz', role: 'Coach', status: 'active', is_super_admin: false, last_login: '2026-05-11 07:30' },
    { id: 5, full_name: 'Sardor Tursunov', phone: '+998901112277', email: 'sardor@alphafc.uz', role: 'Coach', status: 'active', is_super_admin: false, last_login: '2026-05-11 07:35' },
    { id: 6, full_name: 'Bekzod Karimov', phone: '+998901112288', email: 'bekzod@alphafc.uz', role: 'Coach', status: 'active', is_super_admin: false, last_login: '2026-05-10 19:00' },
    { id: 7, full_name: 'Jasur Qodirov', phone: '+998901112299', email: 'jasur@alphafc.uz', role: 'Head Coach', status: 'active', is_super_admin: false, last_login: '2026-05-11 06:50' },
    { id: 8, full_name: 'Rustam Aliyev', phone: '+998901113300', email: 'rustam@alphafc.uz', role: 'Coach', status: 'active', is_super_admin: false, last_login: '2026-05-10 20:10' },
    { id: 9, full_name: 'Nodir Ergashev', phone: '+998901113311', email: 'nodir@alphafc.uz', role: 'Admin', status: 'active', is_super_admin: false, last_login: '2026-05-11 09:00' },
    { id: 10, full_name: 'Zafar Olimov', phone: '+998901113322', email: 'zafar@alphafc.uz', role: 'Admin', status: 'inactive', is_super_admin: false, last_login: '2026-04-22 14:11' },
  ];

  const allPermissions = [
    'students:view', 'students:edit', 'groups:view', 'groups:edit',
    'attendance:coach:mark', 'attendance:view', 'sessions:create', 'sessions:manage',
    'reports:attendance:view', 'reports:dashboard:view',
    'settings:system:view', 'settings:system:edit',
    'roles:manage', 'users:manage', 'gate:logs:view',
    'contracts:view', 'contracts:edit',
    'finance:transactions:view', 'finance:transactions:manual', 'finance:transactions:cancel',
    'finance:unassigned:view', 'finance:unassigned:assign',
  ];

  const roles = [
    { id: 1, name: 'Super Admin', description: 'Cheklovsiz toʼliq kirish', users: 1, permissions: allPermissions.slice() },
    { id: 2, name: 'Director', description: 'Hisobotlar va umumiy koʼrish', users: 1, permissions: ['students:view', 'groups:view', 'attendance:view', 'reports:attendance:view', 'reports:dashboard:view', 'gate:logs:view', 'settings:system:view', 'contracts:view', 'finance:transactions:view', 'finance:unassigned:view'] },
    { id: 3, name: 'Accountant', description: 'Moliya va toʼlovlar', users: 1, permissions: ['students:view', 'reports:dashboard:view', 'contracts:view', 'finance:transactions:view', 'finance:transactions:manual', 'finance:transactions:cancel', 'finance:unassigned:view', 'finance:unassigned:assign'] },
    { id: 4, name: 'Admin', description: 'Oʼquvchilar, guruhlar, shartnomalar', users: 2, permissions: ['students:view', 'students:edit', 'groups:view', 'groups:edit', 'attendance:view', 'gate:logs:view', 'reports:dashboard:view', 'contracts:view', 'contracts:edit'] },
    { id: 5, name: 'Head Coach', description: 'Sessiyalar, davomat va guruhlar', users: 1, permissions: ['students:view', 'groups:view', 'groups:edit', 'attendance:view', 'attendance:coach:mark', 'sessions:create', 'sessions:manage'] },
    { id: 6, name: 'Coach', description: 'Davomat va oʼz guruhlari', users: 4, permissions: ['students:view', 'groups:view', 'attendance:view', 'attendance:coach:mark'] },
  ];

  const sessionTopics = ['Yugurish va chidamlilik', 'Pass uzatish texnikasi', 'Driblling mashqlari', 'Standart holatlar', 'Hujum kombinatsiyalari', 'Himoya tarkibi', 'Darvozabon mashqlari', 'Oʼyin amaliyoti', 'Tezlik va reaksiya'];
  const sessions = [];
  let sid = 1;
  for (let day = -7; day <= 4; day++) {
    const date = new Date(2026, 4, 11 + day);
    const dstr = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    for (let g = 0; g < groups.length; g++) {
      if (srand() > 0.55) continue;
      const grp = groups[g];
      sessions.push({
        id: sid++,
        session_date: dstr,
        topic: spick(sessionTopics),
        start_time: spick(['08:00', '10:00', '14:00', '16:00', '18:00']),
        end_time: spick(['09:30', '11:30', '15:30', '17:30', '19:30']),
        station: spick(['Maydon 1', 'Maydon 2', 'Yopiq zal', 'Asosiy maydon']),
        group_id: grp.id,
        group_name: grp.name,
        coach_id: grp.coach_id,
        coach_name: grp.coach_name,
        status: day < 0 ? 'completed' : (day === 0 ? 'today' : 'upcoming'),
      });
    }
  }

  const gatelogs = [];
  for (let i = 0; i < 40; i++) {
    const s = spick(students);
    const h = sint(7, 20), m = sint(0, 59);
    gatelogs.push({
      id: i + 1,
      student_id: s.id,
      student_name: s.full_name,
      group_name: s.group_name,
      direction: srand() < 0.5 ? 'in' : 'out',
      timestamp: '2026-05-11 ' + pad(h) + ':' + pad(m),
      method: spick(['face', 'face', 'face', 'manual']),
      allowed: srand() < 0.96,
    });
  }
  gatelogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const contracts = students.slice(0, 60).map((s, i) => ({
    id: i + 1,
    student_id: s.id,
    student_name: s.full_name,
    student_phone: s.phone,
    contract_number: (i + 1) + '-2026',
    sequence_number: i + 1,
    contract_year: 2026,
    archive_year: 2026,
    monthly_fee: s.monthly_fee,
    status: srand() < 0.85 ? 'ACTIVE' : (srand() < 0.5 ? 'TERMINATED' : 'EXPIRED'),
    start_date: '2026-01-' + pad(sint(1, 28)),
    end_date: '2026-12-31',
    group_name: s.group_name,
  }));

  const matches = [
    { id: 1, opponent: 'FC Bunyodkor U-12', match_date: '2026-03-15', location: 'Toshkent', is_home: true },
    { id: 2, opponent: 'Pakhtakor Akademiya', match_date: '2026-03-29', location: 'Toshkent', is_home: false },
    { id: 3, opponent: 'FC Lokomotiv U-12', match_date: '2026-04-12', location: 'Toshkent', is_home: true },
    { id: 4, opponent: 'Olympic Akademiya', match_date: '2026-04-26', location: 'Samarqand', is_home: false },
    { id: 5, opponent: 'FC Nasaf U-12', match_date: '2026-05-10', location: 'Toshkent', is_home: true },
  ];

  return { groups, students, users, roles, sessions, gatelogs, contracts, matches, allPermissions };
})();
