// Left-side slow-scrolling rail with district / classroom links.
// Visible only when signed in. The list is intentionally school-y so the page
// looks like a real student portal at a glance.
import { GraduationCap, BookOpen, Calendar, FileText, Users, Mail, ClipboardList, Library, Briefcase, Bell } from "lucide-react";

const LINKS = [
  { label: "Google Classroom", url: "https://classroom.google.com", icon: GraduationCap },
  { label: "School Calendar", url: "https://calendar.google.com", icon: Calendar },
  { label: "Gradebook", url: "https://classroom.google.com/u/0/h", icon: ClipboardList },
  { label: "Assignments", url: "https://classroom.google.com/u/0/a/not-turned-in/all", icon: FileText },
  { label: "School Email", url: "https://mail.google.com", icon: Mail },
  { label: "Library Catalog", url: "https://www.worldcat.org/", icon: Library },
  { label: "Courses", url: "https://classroom.google.com/u/0/h", icon: BookOpen },
  { label: "Class Roster", url: "https://classroom.google.com/u/0/h", icon: Users },
  { label: "Counselor", url: "https://www.google.com/search?q=school+counselor", icon: Briefcase },
  { label: "Announcements", url: "https://classroom.google.com/u/0/h", icon: Bell },
];

export function SideRail() {
  return (
    <div data-noctx
      className="pointer-events-auto absolute left-0 top-0 z-20 hidden h-full w-44 flex-col border-r border-white/5 bg-black/30 backdrop-blur-xl md:flex">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-foreground/50">Xeno OS</div>
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
