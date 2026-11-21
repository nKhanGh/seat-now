import { CheckInSummary } from './checkIn.service';

export const activitySignalLabels: Record<CheckInSummary['activitySignal'], string> = {
  NONE: 'Chưa đủ dữ liệu cộng đồng để nhận xét độ đông.',
  LOW: 'Tín hiệu cộng đồng: ít người ghé trong giờ qua.',
  MODERATE: 'Tín hiệu cộng đồng: có người ghé trong giờ qua.',
  HIGH: 'Tín hiệu cộng đồng: nhiều người ghé trong giờ qua.',
};
