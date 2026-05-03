// District / school links page — formerly the always-visible side rail.
import {
  GraduationCap, BookOpen, Calendar, FileText, Users, Mail, ClipboardList,
  Library, Briefcase, Bell, School, BookMarked, FileSpreadsheet, Video,
  Globe2, Calculator, Microscope, Languages, Music2, Palette, Trophy,
  HeartPulse, Map as MapIcon, FileSearch, Gavel, Megaphone, Newspaper,
  Bus, UtensilsCrossed, ShieldCheck, BookOpenCheck, Search,
} from "lucide-react";
import { useState } from "react";
import { type LucideIcon } from "lucide-react";

interface Link { label: string; url: string; icon: LucideIcon; group: string }

const LINKS: Link[] = [
  // Google Workspace
  { label: "Google Classroom", url: "https://classroom.google.com", icon: GraduationCap, group: "Google" },
  { label: "Google Drive", url: "https://drive.google.com", icon: FileText, group: "Google" },
  { label: "Google Docs", url: "https://docs.google.com", icon: FileText, group: "Google" },
  { label: "Google Sheets", url: "https://sheets.google.com", icon: FileSpreadsheet, group: "Google" },
  { label: "Google Slides", url: "https://slides.google.com", icon: FileText, group: "Google" },
  { label: "School Email", url: "https://mail.google.com", icon: Mail, group: "Google" },
  { label: "School Calendar", url: "https://calendar.google.com", icon: Calendar, group: "Google" },
  { label: "Google Meet", url: "https://meet.google.com", icon: Video, group: "Google" },
  { label: "Google Scholar", url: "https://scholar.google.com", icon: FileSearch, group: "Google" },

  // Classroom
  { label: "Gradebook", url: "https://classroom.google.com/u/0/h", icon: ClipboardList, group: "Classroom" },
  { label: "Assignments", url: "https://classroom.google.com/u/0/a/not-turned-in/all", icon: BookOpenCheck, group: "Classroom" },
  { label: "Class Roster", url: "https://classroom.google.com/u/0/h", icon: Users, group: "Classroom" },
  { label: "Announcements", url: "https://classroom.google.com/u/0/h", icon: Bell, group: "Classroom" },

  // Learning
  { label: "Khan Academy", url: "https://www.khanacademy.org", icon: BookMarked, group: "Learning" },
  { label: "Quizlet", url: "https://quizlet.com", icon: BookOpen, group: "Learning" },
  { label: "Kahoot", url: "https://kahoot.it", icon: Trophy, group: "Learning" },
  { label: "IXL Learning", url: "https://www.ixl.com", icon: Calculator, group: "Learning" },
  { label: "NoRedInk", url: "https://www.noredink.com", icon: BookOpen, group: "Learning" },
  { label: "Desmos", url: "https://www.desmos.com/calculator", icon: Calculator, group: "Learning" },
  { label: "Wolfram Alpha", url: "https://www.wolframalpha.com", icon: Calculator, group: "Learning" },
  { label: "PhET Sims", url: "https://phet.colorado.edu", icon: Microscope, group: "Learning" },
  { label: "Duolingo", url: "https://www.duolingo.com", icon: Languages, group: "Learning" },
  { label: "Music Theory", url: "https://musictheory.net", icon: Music2, group: "Learning" },
  { label: "Met Museum", url: "https://www.metmuseum.org", icon: Palette, group: "Learning" },

  // Reference
  { label: "Wikipedia", url: "https://en.wikipedia.org", icon: Globe2, group: "Reference" },
  { label: "Britannica", url: "https://www.britannica.com", icon: BookOpen, group: "Reference" },
  { label: "JSTOR", url: "https://www.jstor.org", icon: FileSearch, group: "Reference" },
  { label: "Library Catalog", url: "https://www.worldcat.org/", icon: Library, group: "Reference" },

  // District
  { label: "District Portal", url: "https://www.google.com/search?q=district+student+portal", icon: School, group: "District" },
  { label: "Parent Portal", url: "https://www.google.com/search?q=district+parent+portal", icon: Megaphone, group: "District" },
  { label: "School News", url: "https://www.google.com/search?q=school+district+news", icon: Newspaper, group: "District" },
  { label: "PE / Athletics", url: "https://www.google.com/search?q=school+athletics", icon: HeartPulse, group: "District" },
  { label: "Lunch Menu", url: "https://www.google.com/search?q=school+lunch+menu", icon: UtensilsCrossed, group: "District" },
  { label: "Bus Routes", url: "https://www.google.com/search?q=district+bus+routes", icon: Bus, group: "District" },
  { label: "Campus Map", url: "https://www.google.com/maps", icon: MapIcon, group: "District" },
  { label: "Counselor", url: "https://www.google.com/search?q=school+counselor", icon: Briefcase, group: "District" },
  { label: "Code of Conduct", url: "https://www.google.com/search?q=district+code+of+conduct", icon: Gavel, group: "District" },
  { label: "Anti-Bullying", url: "https://www.google.com/search?q=anti-bullying+resources", icon: ShieldCheck, group: "District" },
];

const GROUPS = ["Google", "Classroom", "Learning", "Reference", "District"];

export function District() {
  const [q, setQ] = useState("");
  const filtered = LINKS.filter((l) => l.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex h-full flex-col bg-background/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <School className="h-4 w-4" />
        <span className="text-sm font-medium">School District</span>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
          <Search className="h-3.5 w-3.5 text-foreground/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search links"
            className="w-44 bg-transparent text-xs outline-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {GROUPS.map((g) => {
          const items = filtered.filter((l) => l.group === g);
          if (!items.length) return null;
          return (
            <section key={g} className="mb-6">
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/50">{g}</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {items.map((l) => (
                  <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-white/[0.04] p-3 text-xs ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:bg-white/10 hover:ring-white/15">
                    <l.icon className="h-4 w-4 shrink-0 text-foreground/60" />
                    <span className="truncate">{l.label}</span>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
