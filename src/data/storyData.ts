import { JournalEntry } from '../types/game';

export interface BackstorySlide {
  id: string;
  yearLabel: string;
  imageUrl: string;
  titleEn: string;
  titleRu: string;
  textEn: string;
  textRu: string;
  factBadgeEn: string;
  factBadgeRu: string;
}

export const BACKSTORY_SLIDES: BackstorySlide[] = [
  {
    id: 'climate_2140',
    yearLabel: '2140',
    imageUrl: '/assets/aistudio/2026-11-15_10.06.03_1685d2f3.jpg',
    titleEn: 'Earth in the Year 2140',
    titleRu: 'Земля в 2140 году',
    textEn:
      'For decades, humanity faced stronger heatwaves, droughts, floods, and strain on food and water systems. Nations invested heavily in cleaner, more resilient cities—yet everyday life still depended on fragile power grids.',
    textRu:
      'Десятилетиями человечество сталкивалось с экстремальной жарой, засухами, наводнениями и нехваткой воды. Люди строили умные города, но жизнь всё ещё сильно зависела от уязвимых электросетей.',
    factBadgeEn: 'Science Fact: Climate stress increases pressure on water and energy networks.',
    factBadgeRu: 'Научный факт: изменение климата усиливает нагрузку на воду и энергосети.',
  },
  {
    id: 'solar_storm_2140',
    yearLabel: '2140 · STORM',
    imageUrl: '/assets/aistudio/2026-11-15_10.05.04_02c2a359.jpg',
    titleEn: 'The Great Solar Storm',
    titleRu: 'Мощная солнечная буря',
    textEn:
      'One night in 2140, an intense solar storm struck Earth’s magnetic field. Satellites lost signal, navigation glitched, and whole regions went dark. Earth remained our home—but the crisis proved we needed self-sustaining engineering.',
    textRu:
      'Однажды ночью в 2140 году мощная солнечная буря ударила по магнитному полю Земли. Спутники потеряли сигнал, а целые районы погрузились во тьму. Земля осталась нашим домом, но стало ясно: нужны автономные технологии.',
    factBadgeEn: 'Science Fact: Strong geomagnetic storms can disrupt real satellites and power grids.',
    factBadgeRu: 'Научный факт: сильные солнечные бури действительно нарушают работу спутников и сетей.',
  },
  {
    id: 'pioneers',
    yearLabel: 'PIONEERS',
    imageUrl: '/assets/aistudio/2026-11-15_10.05.22_db6b16da.jpg',
    titleEn: 'Standing on Pioneers’ Shoulders',
    titleRu: 'Наследие первооткрывателей',
    textEn:
      'Generations of brilliant scientists—especially pioneering women engineers, mathematicians, and astronauts—taught us how to write reliable flight software, calculate orbits, and survive beyond Earth.',
    textRu:
      'Поколения учёных, математиков и женщин-первооткрывателей космоса научили нас создавать надёжные программы, точно рассчитывать орбиты и жить за пределами Земли.',
    factBadgeEn: 'Historical Tribute: Real NASA & spaceflight pioneers inspire every training lab.',
    factBadgeRu: 'История науки: реальные достижения учёных лежат в основе подготовки миссии.',
  },
  {
    id: 'absidian_launch',
    yearLabel: 'ABSIDIAN',
    imageUrl: '/assets/aistudio/2026-11-15_10.08.21_bb838d4c.jpg',
    titleEn: 'Project ABSIDIAN Begins',
    titleRu: 'Рождение проекта ABSIDIAN',
    textEn:
      'The international space community launched PROJECT ABSIDIAN: build a self-sustaining base on the Moon, then Mars—and use those closed-loop water, air, and solar inventions to protect Earth too. Tonight, your lab is about to be tested.',
    textRu:
      'Международное научное сообщество запустило проект ABSIDIAN: создать автономную базу на Луне и Марсе, чтобы технологии переработки воды и энергии помогали и на Земле. И прямо сейчас буря обрушивается на твою лабораторию!',
    factBadgeEn: 'You are a young cat engineer who keeps buildings alive when outside power fails.',
    factBadgeRu: 'Ты — молодой котик-инженер, создающий системы автономного выживания зданий.',
  },
];

export interface PioneerProfile {
  name: string;
  roleEn: string;
  roleRu: string;
  factEn: string;
  factRu: string;
  year: string;
}

export const SPACE_PIONEERS: PioneerProfile[] = [
  {
    name: 'Margaret Hamilton',
    roleEn: 'Apollo Flight Software Director',
    roleRu: 'Руководитель ПО миссии «Аполлон»',
    factEn: 'Led the team that built Apollo’s fault-tolerant landing software, preventing abort during Apollo 11.',
    factRu: 'Создала надёжное программное обеспечение посадки «Аполлона-11», которое спасло миссию от сбоя.',
    year: '1969',
  },
  {
    name: 'Katherine Johnson',
    roleEn: 'NASA Orbital Mathematician',
    roleRu: 'Математик орбитальных траекторий NASA',
    factEn: 'Calculated precise orbital trajectories for Mercury and Apollo lunar rendezvous missions.',
    factRu: 'Рассчитывала точные космические траектории для первых полётов и высадки на Луну.',
    year: '1961–1969',
  },
  {
    name: 'Valentina Tereshkova',
    roleEn: 'First Woman in Space',
    roleRu: 'Первая женщина в космосе',
    factEn: 'Completed 48 orbits around Earth aboard Vostok 6 in 1963 and tested spacecraft orientation systems.',
    factRu: 'Совершила 48 витков вокруг Земли на корабле «Восток-6» в 1963 году.',
    year: '1963',
  },
  {
    name: 'Christina Koch',
    roleEn: 'Long-Duration Spaceflight Astronaut',
    roleRu: 'Астронавт длительных экспедиций',
    factEn: 'Set the record for the longest single spaceflight by a woman (328 days) and conducted ISS science.',
    factRu: 'Провела 328 дней на орбите, изучая жизнь и работу систем жизнеобеспечения в космосе.',
    year: '2019–2020',
  },
  {
    name: 'Sally Ride',
    roleEn: 'First American Woman in Space',
    roleRu: 'Первая американка в космосе',
    factEn: 'Physicist and Space Shuttle astronaut who operated the robotic arm to deploy satellites.',
    factRu: 'Физик и астронавт шаттла, управлявшая космическим манипулятором на орбите.',
    year: '1983',
  },
  {
    name: 'Mae Jemison',
    roleEn: 'Engineer, Physician & Astronaut',
    roleRu: 'Инженер, врач и астронавт',
    factEn: 'First Black woman in space; conducted life-science and bone-cell experiments on Endeavour.',
    factRu: 'Провела важные биологические и медицинские эксперименты на борту шаттла «Индевор».',
    year: '1992',
  },
  {
    name: 'Kalpana Chawla',
    roleEn: 'Aerospace Engineer & Astronaut',
    roleRu: 'Аэрокосмический инженер и астронавт',
    factEn: 'Specialized in fluid dynamics and robotics aboard two Space Shuttle missions.',
    factRu: 'Занималась аэродинамикой, робототехникой и научными экспериментами на орбите.',
    year: '1997–2003',
  },
  {
    name: 'Dorothy Vaughan',
    roleEn: 'Computing Pioneer & Supervisor',
    roleRu: 'Пионер вычислений и программирования',
    factEn: 'Mastered early FORTRAN programming and led NASA’s West Area Computing group.',
    factRu: 'Одной из первых освоила язык FORTRAN и руководила вычислительным отделом NASA.',
    year: '1949–1971',
  },
  {
    name: 'Mary Jackson',
    roleEn: 'NASA’s First Black Female Engineer',
    roleRu: 'Первая темнокожая женщина-инженер NASA',
    factEn: 'Researched supersonic wind tunnels and aerodynamics to make aircraft and spacecraft safer.',
    factRu: 'Исследовала сверхзвуковые аэродинамические трубы для безопасности летательных аппаратов.',
    year: '1958',
  },
  {
    name: 'Nancy Grace Roman',
    roleEn: 'NASA Astronomer ("Mother of Hubble")',
    roleRu: 'Астроном NASA («Мать телескопа Хаббл»)',
    factEn: 'Championed space telescopes that let humanity peer into distant galaxies free of Earth’s atmosphere.',
    factRu: 'Возглавила создание космических телескопов, открывших человечеству далёкие галактики.',
    year: '1960–1990',
  },
];

export const INITIAL_JOURNAL: JournalEntry[] = [
  {
    id: 'entry_2140_storm',
    chapter: 'Prologue',
    titleEn: '2140 Solar Storm & Autonomous Grids',
    titleRu: 'Солнечная буря 2140 года и автономные сети',
    summaryEn: 'A massive solar storm knocked out city power. My lab survived by balancing backup energy.',
    summaryRu: 'Солнечная буря отключила свет в городе. Лаборатория устояла благодаря точному распределению энергии.',
    scienceLessonEn: 'Real science: When backup power is scarce, critical systems (air & water) must come before lab experiments.',
    scienceLessonRu: 'Наука: при нехватке энергии сначала питают воздух и воду, и только потом — научные приборы.',
  },
];
