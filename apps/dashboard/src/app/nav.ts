import {
  ChalkboardTeacherIcon,
  ChartBarIcon,
  ChatsCircleIcon,
  CurrencyInrIcon,
  GearSixIcon,
  GraduationCapIcon,
  MegaphoneIcon,
  NotebookIcon,
  ReceiptIcon,
  RobotIcon,
  CardsIcon,
  UsersIcon,
  UsersThreeIcon,
  type Icon,
} from '@phosphor-icons/react'

export interface NavItem {
  to: string
  /** Key under `nav.` in the locale files. */
  key: string
  icon: Icon
}

/** The four daily screens: bottom tabs on phones (plus "Aur"), first group in the sidebar (§15). */
export const PRIMARY_NAV: NavItem[] = [
  { to: '/', key: 'home', icon: NotebookIcon },
  { to: '/chat', key: 'chat', icon: ChatsCircleIcon },
  { to: '/leads', key: 'leads', icon: UsersThreeIcon },
  { to: '/fees', key: 'fees', icon: CurrencyInrIcon },
]

/** Everything behind "Aur": set-up and teaching, then running the business. */
export const MORE_NAV: NavItem[][] = [
  [
    { to: '/courses', key: 'courses', icon: GraduationCapIcon },
    { to: '/campaigns', key: 'campaigns', icon: MegaphoneIcon },
    { to: '/templates', key: 'templates', icon: CardsIcon },
    { to: '/knowledge', key: 'knowledge', icon: ChalkboardTeacherIcon },
    { to: '/bot', key: 'bot', icon: RobotIcon },
  ],
  [
    { to: '/reports', key: 'reports', icon: ChartBarIcon },
    { to: '/team', key: 'team', icon: UsersIcon },
    { to: '/billing', key: 'billing', icon: ReceiptIcon },
    { to: '/settings', key: 'settings', icon: GearSixIcon },
  ],
]

export const ALL_NAV = [PRIMARY_NAV, ...MORE_NAV].flat()
