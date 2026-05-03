// Left-side slow-scrolling rail with district / classroom links.
import {
  GraduationCap, BookOpen, Calendar, FileText, Users, Mail, ClipboardList,
  Library, Briefcase, Bell, School, BookMarked, FileSpreadsheet, Video,
  Globe2, Calculator, Microscope, Languages, Music2, Palette, Trophy,
  HeartPulse, Map as MapIcon, FileSearch, Gavel, Megaphone, Newspaper,
  Bus, UtensilsCrossed, ShieldCheck, BookOpenCheck,
} from "lucide-react";

const LINKS = [
  { label: "Google Classroom", url: "https://classroom.google.com", icon: GraduationCap },
  { label: "Google Drive", url: "https://drive.google.com", icon: FileText },
  { label: "Google Docs", url: "https://docs.google.com", icon: FileText },
  { label: "Google Sheets", url: "https://sheets.google.com", icon: FileSpreadsheet },
  { label: "Google Slides", url: "https://slides.google.com", icon: FileText },
  { label: "School Email", url: "https://mail.google.com", icon: Mail },
  { label: "School Calendar", url: "https://calendar.google.com", icon: Calendar },
  { label: "Google Meet", url: "https://meet.google.com", icon: Video },
  { label: "Gradebook", url: "https://classroom.google.com/u/0/h", icon: ClipboardList },
  { label: "Assignments", url: "https://classroom.google.com/u/0/a/not-turned-in/all", icon: BookOpenCheck },
  { label: "District Portal", url: "https://www.google.com/search?q=district+student+portal", icon: School },
  { label: "Library Catalog", url: "https://www.worldcat.org/", icon: Library },
  { label: "Khan Academy", url: "https://www.khanacademy.org", icon: BookMarked },
  { label: "Quizlet", url: "https://quizlet.com", icon: BookOpen },
  { label: "Kahoot", url: "https://kahoot.it", icon: Trophy },
  { label: "IXL Learning", url: "https://www.ixl.com", icon: Calculator },
  { label: "NoRedInk", url: "https://www.noredink.com", icon: BookOpen },
  { label: "Desmos", url: "https://www.desmos.com/calculator", icon: Calculator },
  { label: "Wolfram Alpha", url: "https://www.wolframalpha.com", icon: Calculator },
  { label: "Wikipedia", url: "https://en.wikipedia.org", icon: Globe2 },
  { label: "Britannica", url: "https://www.britannica.com", icon: BookOpen },
  { label: "JSTOR", url: "https://www.jstor.org", icon: FileSearch },
  { label: "Google Scholar", url: "https://scholar.google.com", icon: FileSearch },
  { label: "Class Roster", url: "https://classroom.google.com/u/0/h", icon: Users },
  { label: "Counselor", url: "https://www.google.com/search?q=school+counselor", icon: Briefcase },
  { label: "Announcements", url: "https://classroom.google.com/u/0/h", icon: Bell },
  { label: "School News", url: "https://www.google.com/search?q=school+district+news", icon: Newspaper },
  { label: "PE / Athletics", url: "https://www.google.com/search?q=school+athletics", icon: HeartPulse },
  { label: "Lunch Menu", url: "https://www.google.com/search?q=school+lunch+menu", icon: UtensilsCrossed },
  { label: "Bus Routes", url: "https://www.google.com/search?q=district+bus+routes", icon: Bus },
  { label: "Campus Map", url: "https://www.google.com/maps", icon: MapIcon },
  { label: "Code of Conduct", url: "https://www.google.com/search?q=district+code+of+conduct", icon: Gavel },
  { label: "Anti-Bullying", url: "https://www.google.com/search?q=anti-bullying+resources", icon: ShieldCheck },
  { label: "Parent Portal", url: "https://www.google.com/search?q=district+parent+portal", icon: Megaphone },
  { label: "Science Lab", url: "https://phet.colorado.edu", icon: Microscope },
  { label: "Languages", url: "https://www.duolingo.com", icon: Languages },
  { label: "Music Class", url: "https://musictheory.net", icon: Music2 },
  { label: "Art Class", url: "https://www.metmuseum.org", icon: Palette },
];

export function SideRail() {
  return (
    <div data-noctx
      className="pointer-events-auto absolute left-0 top-0 z-20 hidden h-full w-44 flex-col border-r border-white/5 bg-black/30 backdrop-blur-xl md:flex">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-foreground/60">Xeno OS</div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="side-rail-track flex flex-col gap-1 px-2 py-3">
          {[...LINKS, ...LINKS].map((l, i) => (
            <a key={`${l.label}-${i}`} href={l.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[11px] text-foreground/65 transition hover:bg-white/10 hover:text-foreground">
              <l.icon className="h-3.5 w-3.5 shrink-0 text-foreground/45" />
              <span className="truncate">{l.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
