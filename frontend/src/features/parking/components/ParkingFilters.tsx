import { ParkingFilters as ParkingFilterValues } from '../services/parking.service';

export function ParkingFilters({ value, onChange }: { value: ParkingFilterValues; onChange: (next: ParkingFilterValues) => void }) {
  return <div className="parking-filters" aria-label="Lọc bãi đỗ xe">
    <select aria-label="Loại xe" value={value.vehicleType} onChange={(event) => onChange({ ...value, vehicleType: event.target.value as ParkingFilterValues['vehicleType'] })}>
      <option value="">Mọi loại xe</option><option value="MOTORBIKE">Xe máy</option><option value="CAR">Ô tô</option>
    </select>
    <label><input type="checkbox" checked={value.hasAvailability} onChange={(event) => onChange({ ...value, hasAvailability: event.target.checked })} /> Còn chỗ mới</label>
    <label><input type="checkbox" checked={value.open24h} onChange={(event) => onChange({ ...value, open24h: event.target.checked })} /> Mở 24 giờ</label>
    <label><input type="checkbox" checked={value.freeOnly} onChange={(event) => onChange({ ...value, freeOnly: event.target.checked })} /> Miễn phí</label>
  </div>;
}
