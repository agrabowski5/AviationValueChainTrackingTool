import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

// Dynamic icon resolver – returns a Lucide component by name
export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  if (!IconComponent) {
    return <LucideIcons.Box {...props} />;
  }
  return <IconComponent {...props} />;
}

export const ICON_OPTIONS = [
  'Plane', 'Ship', 'Server', 'Zap', 'Box', 'Fuel', 'Building2', 'Factory',
  'Truck', 'Landmark', 'Users', 'TreePine', 'Wrench', 'Globe', 'Warehouse',
  'Container', 'Gauge', 'Leaf', 'Droplets', 'Wind', 'Sun', 'Battery',
  'CircuitBoard', 'Database', 'Cloud', 'Shield', 'Recycle', 'Banknote',
  'BarChart3', 'FileText', 'Settings', 'Package', 'Anchor', 'Radio',
  'Thermometer', 'FlaskConical', 'Atom', 'Cpu', 'HardDrive', 'Network',
];
