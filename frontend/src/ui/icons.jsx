import { forwardRef } from 'react';
import {
  AppWindow, ArrowDown, ArrowDownUp, ArrowUp, ArrowUpDown, Bookmark, Check, ChevronDown,
  ChevronLeft, ChevronRight, Clock, ClockFading, Copy, EllipsisVertical, FileCode, FilePen,
  Flag, Funnel, Globe, Hourglass, House, Info, Keyboard, Link, Maximize2, MessageSquareText,
  Minimize2, Monitor, MousePointerClick, Pause, PencilLine, Play, Plus, Reply, RotateCcw,
  Search, Send, SlidersHorizontal, Trash2, UserCheck, UserPlus, Users, Video, WandSparkles,
  Wifi, Wrench, X, ZoomIn
} from 'lucide-react';

// The dashboard's icon names mapped onto lucide-react. "Filled" icons whose
// meaning depends on a solid shape (play, pause, bookmark, flag) are filled.
const solid = Icon => forwardRef(function SolidIcon(props, ref) {
  return <Icon ref={ref} fill="currentColor" {...props} />;
});

export const IconAngleDown = ChevronDown;
export const IconAngleLeft = ChevronLeft;
export const IconAngleRight = ChevronRight;
export const IconArrowDown = ArrowDown;
export const IconArrowPointerClickFilled = MousePointerClick;
export const IconArrowRotateLeft = RotateCcw;
export const IconArrowUp = ArrowUp;
export const IconArrowsSwitchVertical = ArrowDownUp;
export const IconArrowsSwitchVerticalReverse = ArrowUpDown;
export const IconArrowsUpDown = ArrowUpDown;
export const IconBookmarkFilled = solid(Bookmark);
export const IconBrowserFilled = AppWindow;
export const IconCheck = Check;
export const IconChevronDown = ChevronDown;
export const IconClock = Clock;
export const IconClockEllipsis = ClockFading;
export const IconCompress = Minimize2;
export const IconCopyFilled = Copy;
export const IconDesktop = Monitor;
export const IconDesktopFilled = Monitor;
export const IconEllipsisVertical = EllipsisVertical;
export const IconExpand = Maximize2;
export const IconFilePencilFilled = FilePen;
export const IconFlagFilled = solid(Flag);
export const IconFormCodeFilled = FileCode;
export const IconFunnelFilled = Funnel;
export const IconGlobeArrowPointerSimpleFilled = Globe;
export const IconHourglassHalf = Hourglass;
export const IconHourglassHalfFilled = Hourglass;
export const IconHouseFilled = House;
export const IconInfoCircle = Info;
export const IconKeyboard = Keyboard;
export const IconLinkDiagonal = Link;
export const IconMagnifyingGlass = Search;
export const IconMagnifyingGlassPlus = ZoomIn;
export const IconNotificationTextFilled = MessageSquareText;
export const IconPaperPlaneFilled = Send;
export const IconPauseFilled = solid(Pause);
export const IconPencilLine = PencilLine;
export const IconPencilLineFilled = PencilLine;
export const IconPlayFilled = solid(Play);
export const IconPlus = Plus;
export const IconSliders = SlidersHorizontal;
export const IconTrashFilled = Trash2;
export const IconTurnArrowLeftFilled = Reply;
export const IconUserCheckFilled = UserCheck;
export const IconUserPlusFilled = UserPlus;
export const IconUsersFilled = Users;
export const IconVideoFilled = Video;
export const IconWandMagicFilled = WandSparkles;
export const IconWifi = Wifi;
export const IconWrenchScrewdriver = Wrench;
export const IconXmark = X;
