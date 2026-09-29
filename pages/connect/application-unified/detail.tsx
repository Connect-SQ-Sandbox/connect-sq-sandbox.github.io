/**
 * application-unified — 병원 상세 · 420 진료실 선택(중간 퍼널) 재현
 * 기준: goodoc-mobile production @1ebac45ab (HospitalDetailScreen, Appointment420Screen/AppointmentSelectServiceScreen)
 * 색은 앱 COLORS 토큰(hd-* CSS 변수), 폰트는 GoodocText fontStyle 크기를 그대로 옮겼다.
 * 생략: 로그인·본인인증·신분증 게이트, 지도(자리표시), 리뷰 목록·필터, 공유 시트, 외부 링크.
 */
import React, { useEffect, useRef, useState } from 'react';

export type CtaScenario = 'both' | 'receipt' | 'appt' | 'none' | 'tablet' | 'receiptClosed' | 'receiptLater' | 'apptClosed' | 'bridgeOff';
export type OpState = 'open' | 'off' | 'ended';
export type ReviewState = 'show' | 'zero' | 'hidden';
export type ServiceMode = 'examRoomOnly' | 'both' | 'treatmentItemOnly';

export type PriceRow = { id: string; label: string; caption: string; type: 'fixed' | 'discount' | 'consult'; origin: number | null; sale: number | null };
export type TreatmentItem = { id: string; name: string; desc: string; cat: string; sub: string; options: PriceRow[]; thumb?: boolean };
export type ExamRoom = { id: string; name: string; doctor: string; dept: string; desc: string; apptAvailable: boolean };

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
const amountOf = (o: PriceRow) => (o.type === 'discount' && o.sale ? o.sale : o.type === 'fixed' && o.origin ? o.origin : null);

/** As-is utils/treatmentItemPrice.ts 목록 가격 규칙 */
function listPrice(item: TreatmentItem): { text: string; strike?: string; discount: boolean } {
  const rows = item.options;
  const discount = rows.some(r => r.type === 'discount');
  const amounts = rows.map(amountOf);
  if (!rows.length || amounts.every(a => a == null)) return { text: '상담 후 결정', discount };
  if (rows.length === 1 && rows[0].type === 'discount' && rows[0].origin && rows[0].sale) return { text: won(rows[0].sale), strike: won(rows[0].origin), discount };
  const nums = amounts.filter((a): a is number => a != null);
  const min = Math.min(...nums), max = Math.max(...nums);
  if (amounts.some(a => a == null)) return { text: `${won(min)}~`, discount };
  return { text: min === max ? won(min) : `${won(min)}~`, discount };
}

/* ---------- 아이콘 (production svg 원문 경로) ---------- */
const IcBack = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M10.2929 3.29289C10.6834 2.90237 11.3166 2.90237 11.7071 3.29289C12.0976 3.68342 12.0976 4.31658 11.7071 4.70711L5.41421 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H5.41421L11.7071 19.2929C12.0976 19.6834 12.0976 20.3166 11.7071 20.7071C11.3166 21.0976 10.6834 21.0976 10.2929 20.7071L2.29289 12.7071C1.90237 12.3166 1.90237 11.6834 2.29289 11.2929L10.2929 3.29289Z" fill="#31353F" /></svg>);
const IcShare = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M12.7071 4.70711C12.3166 5.09763 11.6834 5.09763 11.2929 4.70711L10 3.41421V11C10 11.5523 9.55228 12 9 12C8.44772 12 8 11.5523 8 11V3.41421L6.70711 4.70711C6.31658 5.09763 5.68342 5.09763 5.29289 4.70711C4.90237 4.31658 4.90237 3.68342 5.29289 3.29289L8.29289 0.292893C8.48043 0.105357 8.73478 0 9 0C9.26522 0 9.51957 0.105357 9.70711 0.292893L12.7071 3.29289C13.0976 3.68342 13.0976 4.31658 12.7071 4.70711Z" fill="#303642" /><path d="M2 11C2 10.4477 1.55228 10 1 10C0.447715 10 0 10.4477 0 11V17C0 17.5523 0.447715 18 1 18H17C17.5523 18 18 17.5523 18 17V11C18 10.4477 17.5523 10 17 10C16.4477 10 16 10.4477 16 11V16H2V11Z" fill="#303642" /></svg>);
const IcLike = ({ on }: { on: boolean }) => on
  ? (<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12.343 20.6767C12.1504 20.8583 11.8496 20.8583 11.657 20.6767L10.55 19.6332C5.4 14.7978 2 11.8075 2 7.90399C2 4.70454 4.42 2 7.5 2C9.16979 2 10.7751 2.94622 11.8653 4.1707C11.8844 4.19214 11.9033 4.21372 11.9221 4.23544C11.963 4.28285 12.037 4.28285 12.0779 4.23544C12.0967 4.21372 12.1156 4.19214 12.1347 4.1707C13.2249 2.94622 14.8302 2 16.5 2C19.58 2 22 4.70454 22 7.90399C22 11.8075 18.6 14.7978 13.45 19.6332L12.343 20.6767Z" fill="#FF7575" /></svg>)
  : (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: '#31353F' }}><path fillRule="evenodd" clipRule="evenodd" d="M11.919 18.1752L12 18.2516L12.081 18.1752C12.3198 17.951 12.5533 17.7321 12.7818 17.518C15.071 15.3721 16.8436 13.7105 18.1035 12.1586C19.4547 10.4942 20 9.20808 20 7.90399C20 5.64888 18.3217 4 16.5 4C15.5631 4 14.4623 4.56411 13.6285 5.50059L13.5449 5.59777C12.7412 6.56322 11.2588 6.56322 10.4551 5.59777L10.3715 5.50059C9.53774 4.56411 8.43694 4 7.5 4C5.67826 4 4 5.64888 4 7.90399C4 9.20808 4.54526 10.4942 5.89647 12.1586C7.15641 13.7105 8.92904 15.3721 11.2182 17.518L11.919 18.1752ZM12.343 20.6767C12.1504 20.8583 11.8496 20.8583 11.657 20.6767L10.55 19.6332C5.4 14.7978 2 11.8075 2 7.90399C2 4.70454 4.42 2 7.5 2C9.16979 2 10.7751 2.94622 11.8653 4.1707L12 4.32C13.2 2.94622 14.8302 2 16.5 2C19.58 2 22 4.70454 22 7.90399C22 11.8075 18.6 14.7978 13.45 19.6332L12.343 20.6767Z" fill="currentColor" /></svg>);
const IcBadge = () => (<svg width="28" height="18" viewBox="0 0 28 19" fill="none"><path d="M0 9.15385C0 4.09832 3.91751 0 8.75 0H19.25C24.0825 0 28 4.09832 28 9.15385C28 14.2094 24.0825 18.3077 19.25 18.3077H8.75C3.91751 18.3077 0 14.2094 0 9.15385Z" fill="#066AE5" /><path d="M10.0897 12.5013C9.7254 12.5013 9.37318 12.3671 9.09675 12.123C8.82031 11.879 8.6379 11.5413 8.58252 11.1709H7.01343C7.07281 11.9697 7.42319 12.7161 7.99449 13.2605C8.56579 13.805 9.31585 14.1075 10.0946 14.1075C10.8734 14.1075 11.6235 13.805 12.1948 13.2605C12.7661 12.7161 13.1165 11.9697 13.1759 11.1709H11.6008C11.5453 11.542 11.3623 11.8803 11.085 12.1244C10.8078 12.3685 10.4546 12.5022 10.0897 12.5013Z" fill="#F5FAFF" /><path d="M13.1762 3.66113H11.5851V5.26915H13.1762V3.66113Z" fill="#41D293" /><path d="M10.0902 4.86816C9.47903 4.86816 8.88157 5.05462 8.37339 5.40394C7.86521 5.75325 7.46912 6.24974 7.23523 6.83063C7.00134 7.41152 6.94014 8.05071 7.05938 8.66738C7.17862 9.28405 7.47293 9.8505 7.90511 10.2951C8.33728 10.7397 8.8879 11.0425 9.48735 11.1651C10.0868 11.2878 10.7081 11.2248 11.2728 10.9842C11.8375 10.7436 12.3201 10.3361 12.6596 9.81335C12.9992 9.29056 13.1804 8.67593 13.1804 8.04718C13.1794 7.20439 12.8535 6.39643 12.2742 5.80048C11.6949 5.20454 10.9095 4.86925 10.0902 4.86816ZM10.0902 9.61407C9.78898 9.61407 9.49449 9.52218 9.24402 9.35001C8.99354 9.17784 8.79832 8.93312 8.68304 8.64681C8.56776 8.3605 8.5376 8.04545 8.59637 7.7415C8.65514 7.43756 8.80019 7.15837 9.01321 6.93923C9.22622 6.7201 9.49761 6.57086 9.79307 6.51041C10.0885 6.44995 10.3948 6.48097 10.6731 6.59956C10.9514 6.71816 11.1893 6.91899 11.3566 7.17666C11.524 7.43434 11.6133 7.73728 11.6133 8.04718C11.6128 8.46258 11.4522 8.86082 11.1666 9.15455C10.8811 9.44828 10.494 9.61353 10.0902 9.61407Z" fill="#F5FAFF" /><path d="M18.757 9.87969H16.6797V8.42705H18.757V6.25391H20.1455V8.42705H22.2228V9.87969H20.1455V12.0528H18.757V9.87969Z" fill="#6FE2B0" /></svg>);
const IcLoc = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M12 13C13.933 13 15.5 11.433 15.5 9.5C15.5 7.567 13.933 6 12 6C10.067 6 8.5 7.567 8.5 9.5C8.5 11.433 10.067 13 12 13ZM13.7 9.5C13.7 10.4389 12.9389 11.2 12 11.2C11.0611 11.2 10.3 10.4389 10.3 9.5C10.3 8.56112 11.0611 7.8 12 7.8C12.9389 7.8 13.7 8.56112 13.7 9.5Z" fill="#434956" /><path fillRule="evenodd" clipRule="evenodd" d="M12 0.199219C9.40219 0.199219 6.90259 1.2072 5.05321 3.01424C3.39796 4.63161 2.50068 6.48169 2.26405 8.43122C2.0311 10.3504 2.45306 12.2338 3.20567 13.9432C4.69492 17.3255 7.61083 20.3371 10.365 22.2806C11.3448 22.9721 12.6553 22.9721 13.6351 22.2806C16.3892 20.3371 19.3052 17.3255 20.7944 13.9432C21.547 12.2338 21.969 10.3504 21.736 8.43122C21.4994 6.48169 20.6021 4.63161 18.9469 3.01424C17.0975 1.2072 14.5979 0.199219 12 0.199219ZM17.6889 4.30168C23.2154 9.70172 17.7479 17.1752 12.5973 20.81C12.2397 21.0623 11.7604 21.0623 11.4028 20.81C6.25218 17.1752 0.784648 9.70172 6.31119 4.30168C7.81996 2.82744 9.86631 1.99922 12 1.99922C14.1338 1.99922 16.1801 2.82744 17.6889 4.30168Z" fill="#434956" /></svg>);
const IcTime = () => (<svg width="18" height="18" viewBox="0 0 18 19" fill="none"><path d="M9.67422 5.74995C9.67422 5.37716 9.37201 5.07495 8.99922 5.07495C8.62643 5.07495 8.32422 5.37716 8.32422 5.74995V9.49995C8.32422 9.63321 8.36366 9.76349 8.43758 9.87437L9.93758 12.1244C10.1444 12.4346 10.5635 12.5184 10.8736 12.3116C11.1838 12.1048 11.2676 11.6857 11.0609 11.3755L9.67422 9.29558V5.74995Z" fill="#434956" /><path fillRule="evenodd" clipRule="evenodd" d="M8.99922 2.07495C4.9 2.07495 1.57422 5.40073 1.57422 9.49995C1.57422 13.5992 4.9 16.925 8.99922 16.925C13.0984 16.925 16.4242 13.5992 16.4242 9.49995C16.4242 5.40073 13.0984 2.07495 8.99922 2.07495ZM2.92422 9.49995C2.92422 6.14515 5.64442 3.42495 8.99922 3.42495C12.354 3.42495 15.0742 6.14515 15.0742 9.49995C15.0742 12.8548 12.354 15.575 8.99922 15.575C5.64442 15.575 2.92422 12.8548 2.92422 9.49995Z" fill="#434956" /></svg>);
const IcStar = ({ c, s = 18 }: { c: string; s?: number }) => (<svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8.47169 12.6736C8.17948 12.519 7.82977 12.5188 7.53741 12.6731L5.2071 13.9029C4.47368 14.2899 3.61497 13.6675 3.75467 12.85L4.20168 10.2344C4.25702 9.91061 4.14979 9.58027 3.91482 9.35069L2.01709 7.49651C1.42469 6.91771 1.75239 5.91089 2.57198 5.79166L5.18249 5.41191C5.50866 5.36446 5.7905 5.15934 5.93593 4.86356L7.10207 2.49181C7.46838 1.74679 8.53054 1.74679 8.89685 2.49181L10.063 4.86356C10.2084 5.15934 10.4903 5.36446 10.8164 5.41191L13.4269 5.79166C14.2465 5.91089 14.5742 6.91771 13.9818 7.49652L12.0841 9.35069C11.8491 9.58027 11.7419 9.91061 11.7972 10.2344L12.2439 12.8477C12.3836 13.6655 11.524 14.288 10.7906 13.9001L8.47169 12.6736Z" fill={c} /></svg>);
const IcArrowR = ({ c = '#808799', s = 19 }: { c?: string; s?: number }) => (<svg width={s} height={s} viewBox="0 0 13 12" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M6.14645 2.14645C5.95118 2.34171 5.95118 2.65829 6.14645 2.85355L9.29289 6L6.14645 9.14645C5.95118 9.34171 5.95118 9.65829 6.14645 9.85355C6.34171 10.0488 6.65829 10.0488 6.85355 9.85355L10.3536 6.35355C10.5488 6.15829 10.5488 5.84171 10.3536 5.64645L6.85355 2.14645C6.65829 1.95118 6.34171 1.95118 6.14645 2.14645Z" fill={c} /></svg>);
const IcMegaphone = () => (<svg width="18" height="18" viewBox="0 0 18 19" fill="#434956"><path fillRule="evenodd" clipRule="evenodd" d="M13.4976 2.75828C14.4723 2.17341 15.7125 2.87557 15.7125 4.01237V14.1131C15.7125 15.2499 14.4724 15.952 13.4976 15.3672L8.42765 12.3252H7.53751V15.4377C7.53751 15.8312 7.21851 16.1502 6.82501 16.1502C6.4315 16.1502 6.11251 15.8312 6.11251 15.4377V12.3252H4.50001C3.27808 12.3252 2.28751 11.3347 2.28751 10.1127V8.01272C2.28751 6.79079 3.27808 5.80022 4.50001 5.80022H8.42765L13.4976 2.75828ZM14.2875 4.01237L8.99158 7.12369C8.88085 7.19013 8.75414 7.22522 8.62501 7.22522H4.50001C4.06508 7.22522 3.71251 7.5778 3.71251 8.01272V10.1127C3.71251 10.5476 4.06508 10.9002 4.50001 10.9002H8.62501C8.75414 10.9002 8.88085 10.9353 8.99158 11.0018L14.2875 14.1131V4.01237Z" /></svg>);
const IcBell = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M8 0.666992C8.36819 0.666992 8.66667 0.965469 8.66667 1.33366V2.04758C10.9282 2.37105 12.6667 4.316 12.6667 6.66699V8.66699L13.7075 11.7895C13.8514 12.2212 13.5301 12.667 13.0751 12.667H10.5826C10.2866 13.8171 9.24253 14.667 7.99997 14.667C6.75741 14.667 5.71335 13.8171 5.41732 12.667H2.92499C2.46995 12.667 2.14864 12.2212 2.29253 11.7895L3.33337 8.66699V6.66699C3.33337 4.31603 5.07182 2.37109 7.33333 2.04759V1.33366C7.33333 0.965469 7.63181 0.666992 8 0.666992ZM6.84502 12.667C7.07556 13.0655 7.50645 13.3337 7.99997 13.3337C8.49349 13.3337 8.92439 13.0655 9.15493 12.667H6.84502ZM3.84994 11.3337L4.66671 8.88336V6.66699C4.66671 4.82604 6.15909 3.33366 8.00004 3.33366C9.84099 3.33366 11.3334 4.82604 11.3334 6.66699V8.88336L12.1501 11.3337H3.84994Z" fill="currentColor" /></svg>);
const IcCheck = () => (<svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M1 5.91226L5.12499 10.3333L15 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IcNew = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="#FA4655" /><path d="M9.4519 4.05957H8.24237V7.7937H8.18555L5.62036 4.05957H4.54883V9.93677H5.76648V6.20264H5.81519L8.39661 9.93677H9.4519V4.05957Z" fill="white" /></svg>);
const IcLogo = () => (<svg width="12" height="22" viewBox="0 0 12 22" fill="none"><path d="M5.99823 16.6746C5.29098 16.6745 4.60712 16.4214 4.07039 15.9611C3.53366 15.5008 3.17948 14.8637 3.07195 14.165H0.0253906C0.140679 15.6719 0.820998 17.0797 1.93023 18.1067C3.03947 19.1338 4.49581 19.7044 6.00792 19.7044C7.52003 19.7044 8.9764 19.1338 10.0856 18.1067C11.1949 17.0797 11.8752 15.6719 11.9905 14.165H8.93226C8.82453 14.865 8.46924 15.5031 7.93088 15.9636C7.39253 16.4241 6.70682 16.6763 5.99823 16.6746Z" fill="#066AE5" /><path d="M11.9916 0H8.90234V3.03319H11.9916V0Z" fill="#00B380" /><path d="M6.00001 2.27734C2.68618 2.27734 0 4.96353 0 8.27391C0 11.5843 2.68618 14.2705 6.00001 14.2705C9.31383 14.2705 12 11.5843 12 8.27391C11.9979 4.96614 9.31127 2.27945 6.00001 2.27734ZM6.00001 11.2295C4.36746 11.2295 3.04397 9.90617 3.04397 8.27391C3.04397 6.64165 4.36746 5.31836 6.00001 5.31836C7.63256 5.31836 8.95732 6.64165 8.95732 8.27391C8.95629 9.90549 7.63188 11.2285 6.00001 11.2295Z" fill="#066AE5" /></svg>);
const IcDiscount = () => (<svg width="40" height="18" viewBox="0 0 40 18" fill="none"><path d="M6.0992 1.15818C6.66756 0.427418 7.54148 0 8.46725 0L37 0C38.6569 0 40 1.34315 40 3V15C40 16.6569 38.6569 18 37 18H8.46725C7.54148 18 6.66756 17.5726 6.09919 16.8418L1.43253 10.8418C0.589935 9.75849 0.589937 8.24151 1.43253 7.15818L6.0992 1.15818Z" fill="#0073FA" fillOpacity="0.1" /><path d="M9.875 11.625L15.125 6.375M10.75 6.8125C10.75 7.05412 10.5541 7.25 10.3125 7.25C10.0709 7.25 9.875 7.05412 9.875 6.8125C9.875 6.57088 10.0709 6.375 10.3125 6.375C10.5541 6.375 10.75 6.57088 10.75 6.8125ZM15.125 11.1875C15.125 11.4291 14.9291 11.625 14.6875 11.625C14.4459 11.625 14.25 11.4291 14.25 11.1875C14.25 10.9459 14.4459 10.75 14.6875 10.75C14.9291 10.75 15.125 10.9459 15.125 11.1875Z" stroke="#115FD4" strokeLinecap="round" strokeLinejoin="round" /><text x="18" y="13" fontSize="9.5" fontWeight="700" fill="#115FD4" fontFamily="Pretendard, sans-serif">할인</text></svg>);
const IcPin = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14.2202 4.86676C14.5391 5.05086 14.6483 5.45858 14.4642 5.77744L14.4339 5.82993C14.2665 6.1198 13.8959 6.21912 13.606 6.05176C13.577 6.03503 13.54 6.04496 13.5232 6.07395L11.5687 9.45934C11.5588 9.47644 11.5542 9.49607 11.5555 9.51578L11.6887 11.5821C11.7014 11.7791 11.6556 11.9755 11.5568 12.1465L11.5416 12.173C11.2654 12.6512 10.6538 12.8151 10.1755 12.539L7.66406 11.089C7.61623 11.0614 7.55508 11.0778 7.52746 11.1256L5.24413 15.0804L4.08943 14.4138L6.37276 10.4589C6.40037 10.4111 6.38399 10.3499 6.33616 10.3223L3.82468 8.87231C3.34639 8.59617 3.18252 7.98458 3.45866 7.50629L3.47394 7.47982C3.57265 7.30885 3.71976 7.17092 3.89674 7.08341L5.75289 6.16565C5.77058 6.1569 5.78529 6.1431 5.79516 6.12601L7.74972 2.74061C7.76646 2.71163 7.75653 2.67456 7.72754 2.65782C7.43767 2.49047 7.33835 2.1198 7.50571 1.82993L7.53601 1.77744C7.7201 1.45858 8.12783 1.34933 8.44669 1.53343L14.2202 4.86676Z" fill="#479DFF" /></svg>);
const IcRoute = () => (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M9.99943 2.03694C12.1529 2.03694 13.8996 3.78274 13.8996 5.93712C13.8996 9.9 10.5 12.5 9.99943 12.8241C9.5 12.5 6.09925 9.9 6.09925 5.93712C6.09925 3.78368 7.84597 2.03694 9.99943 2.03694Z" stroke="#31353F" strokeWidth="1.2" /><circle cx="10" cy="6.2" r="1.3" stroke="#31353F" strokeWidth="1.1" /><path d="M5.26316 13.0626H2.89474L1 19.0626H19L17.1053 13.0626H14.7368" stroke="#31353F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const Dot = () => <span className="hd-dot" />;

/* ---------- 병원 상세 ---------- */
export function HospitalDetail(props: {
  cta: CtaScenario; tiOn: boolean; op: OpState; review: ReviewState; liked: boolean; onLike: (v: boolean) => void; active: boolean;
  items: TreatmentItem[]; rooms: ExamRoom[];
  onAppt: () => void; onReceipt: () => void; onItem: (id: string) => void; onToast: (m: string) => void;
}) {
  const { cta, tiOn, op, review, items } = props;
  const liked = props.liked, setLiked = props.onLike;
  const [tab, setTab] = useState('병원정보');
  const [chip, setChip] = useState('전체');
  const [sheet, setSheet] = useState<'' | 'apptClosed' | 'receiptClosed' | 'receiptLater' | 'share'>('');
  const [npMax, setNpMax] = useState(false);
  useEffect(() => { if (!props.active) setSheet(''); }, [props.active]);
  const scRef = useRef<HTMLDivElement>(null);
  const secs = useRef<Record<string, HTMLElement | null>>({});

  // 버튼 노출·상태 (SubmitButton / HospitalReceipt 매핑)
  const receiptShown = ['both', 'receipt', 'receiptClosed', 'receiptLater', 'bridgeOff'].includes(cta);
  // isAppointmentEnabled = apptAvailable > -1 || treatmentItemApptAvailable (spec 9-2)
  const apptShown = ['both', 'appt', 'apptClosed', 'bridgeOff'].includes(cta) || tiOn;
  const apptClosed = cta === 'apptClosed' && !tiOn;
  const badgeReceipt = receiptShown;
  const badgeAppt = ['both', 'appt', 'apptClosed', 'bridgeOff'].includes(cta) || tiOn;
  const tablet = cta === 'tablet';
  const anyService = receiptShown || apptShown;
  const bookmarkShown = anyService || tablet;
  const tabs = ['병원정보', '진료정보', ...(review !== 'hidden' ? ['리뷰'] : [])];

  const status = op === 'off' ? '휴진' : op === 'ended' ? '진료종료' : '진료중';
  const statusMsg = op === 'off' ? '오늘은 휴진이에요.' : op === 'ended' ? '오늘의 진료는 종료했어요.' : '지금 진료 중이에요.';
  const todayText = op === 'off' ? '오늘 휴진' : '오늘 09:00 ~ 18:00';

  function goTab(t: string) {
    setTab(t);
    const el = secs.current[t], sc = scRef.current;
    if (el && sc) sc.scrollTo({ top: el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 50, behavior: 'smooth' });
  }
  function onScroll() {
    const sc = scRef.current; if (!sc) return;
    let cur = tabs[0];
    for (const t of tabs) { const el = secs.current[t]; if (el && el.getBoundingClientRect().top - sc.getBoundingClientRect().top <= 60) cur = t; }
    if (cur !== tab) setTab(cur);
  }

  const cats = ['전체', ...Array.from(new Set(items.map(i => i.cat)))];
  const shown = items.filter(i => chip === '전체' || i.cat === chip);
  const preview = shown.slice(0, 10);

  // CTA 버튼
  const ctaButtons: React.ReactNode[] = [];
  if (!anyService) {
    ctaButtons.push(<button key="tel" type="button" className="hd-btn tonal-blue" onClick={() => props.onToast('병원 대표번호로 전화를 걸어요 (체험)')}>전화문의</button>);
  } else {
    if (apptShown) {
      const filled = !receiptShown;
      ctaButtons.push(apptClosed
        ? <button key="appt" type="button" className="hd-btn tonal-gray" onClick={() => setSheet('apptClosed')}>예약 마감</button>
        : <button key="appt" type="button" className={`hd-btn ${filled ? 'filled' : 'tonal-blue'}`} onClick={props.onAppt}>예약</button>);
    }
    if (receiptShown) {
      if (cta === 'bridgeOff') ctaButtons.push(<button key="rc" type="button" className="hd-btn tonal-gray" disabled>미리접수</button>);
      else if (cta === 'receiptClosed') ctaButtons.push(<button key="rc" type="button" className="hd-btn tonal-gray" onClick={() => setSheet('receiptClosed')}>미리접수 마감</button>);
      else if (cta === 'receiptLater') ctaButtons.push(<button key="rc" type="button" className="hd-btn filled" onClick={() => setSheet('receiptLater')}>미리접수</button>);
      else ctaButtons.push(<button key="rc" type="button" className="hd-btn filled" onClick={props.onReceipt}>미리접수</button>);
    }
  }

  return (
    <div className="hd-root">
      <div className="hd-header">
        <button type="button" aria-label="뒤로" onClick={() => props.onToast('검색 결과로 돌아가요 (생략)')}><IcBack /></button>
        <span style={{ flex: 1 }} />
        <button type="button" aria-label="공유" onClick={() => props.onToast('공유 시트를 열어요 (생략)')}><IcShare /></button>
        <button type="button" aria-label="관심 병원" onClick={() => setLiked(!liked)}><IcLike on={liked} /></button>
      </div>
      <div className="hd-scroll" ref={scRef} onScroll={onScroll}>
        {/* DetailMeta */}
        <div className="hd-meta">
          <div className="hd-photo" aria-label="병원 사진"><span>병원 사진</span></div>
          <button type="button" className="hd-pinned" onClick={() => goTab('진료정보')}>
            <span className="hd-pinned-chip">공지</span><span className="hd-pinned-title">10월 3일(토) 개천절 휴진 안내</span><IcArrowR c="rgba(128,135,153,.4)" s={20} />
          </button>
          <div className="hd-name-block">
            {(badgeReceipt || badgeAppt || tablet) && (
              <div className="hd-badges"><IcBadge />
                {[badgeReceipt && '미리접수', badgeAppt && '예약'].filter(Boolean).map((l, i) => (<React.Fragment key={String(l)}>{i > 0 && <span className="hd-bdot" />}<span className="hd-badge-l">{l}</span></React.Fragment>))}
              </div>
            )}
            <h1 className="hd-name">굿닥가족의원</h1>
            <div className="hd-review-row">
              {review === 'hidden' ? (<><IcStar c="#A8AEBD" /><span className="t-b1-500 g50">리뷰 미제공</span></>)
                : review === 'zero' ? (<><IcStar c="#A8AEBD" /><span className="t-b1-500 g50">수집중</span></>)
                  : (<button type="button" className="hd-link" onClick={() => goTab('리뷰')}><IcStar c="#434956" /><span className="t-b1-500 g90">4.6</span><Dot /><span className="t-b1-400 g80">리뷰 128</span></button>)}
              <Dot /><span className="t-b1-400 g60 hd-ellipsis">가정의학과, 소아청소년과</span>
            </div>
            <div className="hd-info-row"><IcLoc /><span className="t-b2-500 g90">350m</span><Dot /><span className="t-b2-400 g80">서울시 강남구 테헤란로</span></div>
            <div className="hd-info-row"><IcTime /><span className="t-b2-500 g90">{status}</span><Dot /><span className="t-b2-400 g80">{todayText}</span></div>
          </div>
          <button type="button" className="hd-share-row" onClick={() => props.onToast('병원 정보 제보 시트를 열어요 (생략)')}>
            <IcMegaphone /><span className="t-b2-500 g80">알려주실 병원 정보가 있으신가요?</span><IcArrowR />
          </button>
          {bookmarkShown && (
            <div className="hd-bookmark">
              <span className="t-b2-600 g80"><b className="blue70">{(1204 + (liked ? 1 : 0)).toLocaleString('ko-KR')}</b>명이 병원 소식을 받고 있어요</span>
              {liked ? <button type="button" className="hd-sbtn gray" onClick={() => setLiked(false)}><IcCheck />소식 받는 중</button>
                : <button type="button" className="hd-sbtn blue" onClick={() => setLiked(true)}><IcBell />소식 받기</button>}
            </div>
          )}
        </div>

        {/* ScrollTab (sticky) */}
        <nav className="hd-tabs" aria-label="병원 상세 탭">
          {tabs.map(t => <button key={t} type="button" className={tab === t ? 'on' : ''} onClick={() => goTab(t)}>{t}</button>)}
        </nav>

        {/* 병원정보 */}
        <div ref={el => (secs.current['병원정보'] = el)}>
          <section className="hd-sec first">
            <h2>진료 시간</h2>
            <p className="t-b2-400 g80" style={{ margin: '4px 0 0' }}>{statusMsg}</p>
            <div className="hd-today">
              <div><b className="t-b2-700">오늘</b><span className="t-b1-400">{op === 'off' ? '휴진' : '09:00 ~ 18:00'}</span></div>
              {op !== 'off' && <div><b className="t-b2-700">점심시간</b><span className="t-b1-400">13:00 ~ 14:00</span></div>}
            </div>
            <div className="hd-week">
              {[['월', '09:00 ~ 18:00'], ['화', '09:00 ~ 18:00'], ['수', '09:00 ~ 18:00'], ['목', '09:00 ~ 18:00'], ['금', '09:00 ~ 18:00'], ['토', '09:00 ~ 13:00'], ['일', '휴진'], ['공휴일', '휴진'], ['주말 점심시간', '없음'], ['평일 점심시간', '13:00 ~ 14:00']].map(([d, v]) => {
                const weekend = d === '토' || d === '일' || d === '공휴일';
                const color = weekend ? (v === '휴진' ? '#FB7480' : '#479DFF') : '#31353F';
                return <div key={d}><b className="t-b2-700" style={{ color }}>{d}</b><span className="t-b1-400" style={{ color }}>{v}</span></div>;
              })}
            </div>
          </section>
          <section className="hd-sec">
            <h2>위치</h2>
            <div className="hd-map"><span className="hd-marker" /><span className="hd-map-label">지도 (체험판 자리표시)</span></div>
            <div className="hd-addr-row"><span className="t-b2-600 g90">서울특별시 강남구 테헤란로 123 굿닥빌딩 3층</span><button type="button" className="hd-xbtn" onClick={() => props.onToast('주소가 복사되었어요.')}>주소복사</button></div>
            <div className="hd-subway"><span className="hd-line" style={{ background: '#00A84D' }}>2</span><span>역삼역 350m 이내</span></div>
            <button type="button" className="hd-obtn" onClick={() => props.onToast('길찾기 시트를 열어요 (생략)')}><IcRoute />길찾기</button>
          </section>
          <section className="hd-sec hd-tel">
            <div><h2>전화번호</h2><span className="t-b2-400 g80">02-1234-5678</span></div>
            <button type="button" className="hd-xbtn" onClick={() => props.onToast('전화 앱을 열어요 (체험)')}>전화하기</button>
          </section>
        </div>

        {/* 진료정보 */}
        <div ref={el => (secs.current['진료정보'] = el)}>
          <section className="hd-sec">
            <h2>공지사항</h2>
            <div className="hd-notice">
              <span className="t-c1-400 g50">2026.09.25</span>
              <div className="t-b1-600 g90 hd-ic-line"><IcPin />10월 3일(토) 개천절 휴진 안내</div>
              <p className="t-b2-400 g90">10월 3일(토)은 개천절로 휴진합니다. 10월 5일(월)부터 정상 진료합니다.</p>
            </div>
          </section>
          {tiOn ? (
            <section className="hd-sec hd-ti">
              <div className="hd-ti-head">
                <div className="hd-ic-line" style={{ gap: 4 }}><IcLogo /><h2 style={{ margin: 0 }}><span className="blue70">굿닥</span> 진료항목</h2></div>
                <div className="hd-guide"><b>병원이 직접 입력한 정보예요.</b><span>상세 진료 조건에 따라 실제 가격은 달라질 수 있어요.</span></div>
              </div>
              <div className="hd-chips">{cats.map(c => <button key={c} type="button" className={chip === c ? 'on' : ''} onClick={() => setChip(c)}>{c}</button>)}</div>
              <TreatmentList items={preview} onItem={props.onItem} />
              <button type="button" className="hd-np-link" onClick={() => props.onToast('심평원 비급여 목록으로 이동해요 (생략)')}>건강보험공단 심사평가원 정보 보기</button>
              {shown.length > 10 && <div style={{ padding: '16px 20px 0' }}><button type="button" className="hd-lbtn" onClick={() => props.onToast('진료항목 전체 목록으로 이동해요 (생략)')}>{shown.length}개 전체보기</button></div>}
            </section>
          ) : (
            <section className="hd-sec">
              <div className="hd-np-title"><h2>심사평가원 비급여 진료항목</h2><span className="hd-np-toggle"><button type="button" className={!npMax ? 'on' : ''} onClick={() => setNpMax(false)}>최저가</button><Dot /><button type="button" className={npMax ? 'on' : ''} onClick={() => setNpMax(true)}>최고가</button></span></div>
              <div className="hd-guide" style={{ marginTop: 16 }}><span>2026년 09월 01일 기준 건강보험심사평가원 제공<br />정보를 인용한 것으로 정확한 진료비는 <b>반드시 병원에 직접 문의해주세요.</b></span></div>
              <div className="hd-np-head"><span>진료항목</span><span>{npMax ? '최고가' : '최저가'}</span></div>
              {[['예방접종', '인플루엔자(독감) 4가', '40,000원', '45,000원'], ['예방접종', '대상포진', '180,000원', '230,000원'], ['제증명수수료', '일반진단서', '20,000원', '20,000원']].map(([c, n, lo, hi], i, a) => { const p = npMax ? hi : lo; return (
                <div key={n}>{(i === 0 || a[i - 1][0] !== c) && <div className="hd-np-cat">{c}</div>}<div className="hd-np-row"><span>{n}</span><span>{p}</span></div></div>
              ); })}
            </section>
          )}
          <section className="hd-sec">
            <h2>진료과목</h2>
            <div className="hd-depts">{['가정의학과', '소아청소년과', '내과'].map(d => <span key={d}>{d}</span>)}</div>
          </section>
          <section className="hd-sec">
            <h2>의사선생님</h2>
            <p className="t-b2-400 g80" style={{ margin: '4px 0 0' }}>총 2명 · 전문의 2명 · 여의사 1명</p>
            {[['이다온', '원장', '가정의학과', true], ['박지안', '원장', '소아청소년과', false]].map(([n, r, d, f]) => (
              <div key={String(n)} className="hd-doc"><span className="hd-doc-ph" /><div style={{ flex: 1 }}><b className="t-b1-700">{n} {r}</b><div className="t-b2-400 g80" style={{ marginTop: 8 }}>{d} 전문의</div>{f && <span className="hd-doc-tag">여의사</span>}</div><IcArrowR c="#ACB2C0" s={16} /></div>
            ))}
          </section>
        </div>

        {/* 리뷰 */}
        {review === 'hidden' ? (
          <section className="hd-sec hd-ic-line" style={{ gap: 8, padding: 20 }}><IcStar c="#5D6474" s={20} /><span className="t-b2-400 g90">병원 요청에 따라 리뷰를 제공하지 않아요.</span></section>
        ) : (
          <section className="hd-sec" ref={el => (secs.current['리뷰'] = el)} style={{ paddingTop: 32, paddingBottom: 32 }}>
            <h2 className="t-h4">리뷰 <span style={{ color: '#0073FA' }}>{review === 'zero' ? 0 : 128}</span></h2>
            {review === 'zero' ? (
              <div className="hd-review-empty"><span className="hd-review-img" /><span className="t-b1-500 g70">아직 리뷰가 없어요.</span></div>
            ) : (
              <>
                <p className="t-b1-500 g80">이 병원을 <b style={{ color: '#0073FA' }}>92%</b>가 추천하고 싶어해요👍</p>
                <div className="hd-score">
                  <div className="hd-score-l"><b>4.6</b><span>{[0, 1, 2, 3, 4].map(i => <IcStar key={i} c={i < 4 ? '#FFC700' : '#E3E6ED'} s={14} />)}</span></div>
                  <div className="hd-score-r">{[['매우 만족', 96], ['만족', 22], ['보통', 6], ['별로', 3], ['매우 별로', 1]].map(([l, n], i) => (
                    <div key={String(l)}><span>{l}</span><i><em style={{ width: `${(Number(n) / 96) * 100}%`, background: i === 0 ? '#0073FA' : '#A8AEBD' }} /></i><span>{n}</span></div>
                  ))}</div>
                </div>
                <button type="button" className="hd-lbtn" style={{ marginTop: 24 }} onClick={() => props.onToast('리뷰 목록으로 이동해요 (생략)')}>128개 전체보기</button>
              </>
            )}
          </section>
        )}

        <div className="hd-guide-bottom">
          <p>굿닥의 병원 정보는 건강보험심사평가원 공개 데이터와 병원 및 이용자 제보를 기반으로 구성됩니다. 제휴 병원은 직접 정보를 관리하며, 일부 정보는 실제와 다를 수 있습니다.</p>
          {['알고 계신 병원정보와 다른가요?', '사진 정보를 더하고 싶으신가요?', '이 병원의 관계자이신가요?'].map(t => <button key={t} type="button" onClick={() => props.onToast('외부 링크로 이동해요 (생략)')}><span>{t}</span><IcArrowR /></button>)}
        </div>
        <div style={{ height: 90 }} />
      </div>

      <div className={`hd-cta ${!anyService && !tablet ? 'line' : ''}`}>{ctaButtons}</div>

      {sheet && (
        <div className="au-dim" onClick={e => { if (e.target === e.currentTarget) setSheet(''); }}>
          <div className="au-sheet hd-sheet" role="dialog" aria-modal="true">
            {sheet === 'apptClosed' && (<><h3>지금은 예약할 수 없어요</h3><p>모든 진료실의 예약이 마감되었어요.<br />다음에 다시 예약을 시도해 주세요.</p><button type="button" className="hd-btn tonal-blue" onClick={() => setSheet('')}>확인</button></>)}
            {sheet === 'receiptClosed' && (<><h3>오늘은 접수가 마감되었어요</h3><p className="g60">{apptShown ? <>다음 진료일에 접수하거나<br />원하는 날짜와 시간에 미리 예약해주세요</> : '다음 진료일에 다시 접수해주세요'}</p><button type="button" className="hd-btn tonal-blue" onClick={() => setSheet('')}>확인</button></>)}
            {sheet === 'receiptLater' && (<><h3>미리접수 운영시간</h3>
              <div className="hd-rc-rows">{props.rooms.map((r, i) => <div key={r.id}><span className="t-b1-500 g90">{r.name}</span><span className="t-b2-500" style={{ color: i === 0 ? '#0073FA' : '#A8AEBD' }}>{i === 0 ? '14:30부터 접수 가능' : '미리접수 마감'}</span></div>)}</div>
              <button type="button" className="hd-btn filled" onClick={() => setSheet('')}>확인</button></>)}
          </div>
        </div>
      )}
    </div>
  );
}

export function TreatmentList({ items, onItem }: { items: TreatmentItem[]; onItem: (id: string) => void }) {
  return (
    <div>
      {items.map((it, i) => {
        const p = listPrice(it);
        const head = i === 0 || items[i - 1].sub !== it.sub;
        return (
          <React.Fragment key={it.id}>
            {head && <div className="hd-sub-title">{it.sub}</div>}
            <button type="button" className="hd-ti-row" onClick={() => onItem(it.id)}>
              <span className="hd-ti-col">
                <span className="t-b1-500 g90 hd-2l">{it.name}</span>
                <span className="t-c2-400 g60 hd-2l">{it.desc}</span>
                <span className="hd-ti-price">{p.strike && <s className="t-b2-500 g60">{p.strike}</s>}<b className="t-h5-600 g90">{p.text}</b>{p.discount && <IcDiscount />}</span>
              </span>
              {it.thumb && <span className="hd-thumb" />}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ---------- 420 예약 중간 퍼널: 진료실/진료항목 선택 (AppointmentSelectServiceScreen) ---------- */
export function ServiceSelect(props: {
  mode: ServiceMode; rooms: ExamRoom[]; items: TreatmentItem[];
  onBack: () => void; onRoom: (id: string) => void; onItem: (id: string) => void;
}) {
  const [view, setView] = useState<'room' | 'item'>(props.mode === 'treatmentItemOnly' ? 'item' : 'room');
  useEffect(() => { setView(props.mode === 'treatmentItemOnly' ? 'item' : 'room'); }, [props.mode]);
  const [pressed, setPressed] = useState('');
  const [chip, setChip] = useState('전체');
  const cats = ['전체', ...Array.from(new Set(props.items.map(i => i.cat)))];
  const current = props.mode === 'examRoomOnly' ? 'room' : props.mode === 'treatmentItemOnly' ? 'item' : view;
  return (
    <div className="hd-root">
      <div className="ss-header">
        <button type="button" aria-label="뒤로" onClick={props.onBack}><IcBack /></button>
        {props.mode === 'both' && (
          <div className="ss-toggle" role="tablist">
            {(['room', 'item'] as const).map(v => <button key={v} type="button" role="tab" aria-selected={view === v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{v === 'room' ? '진료실' : '진료항목'}</button>)}
          </div>
        )}
      </div>
      <div className="hd-scroll">
        {current === 'room' ? (
          <div className="ss-rooms">
            <h1 className="t-h3">진료실을 선택해 주세요</h1>
            <div className="ss-cards">
              {props.rooms.filter(r => r.apptAvailable).map(r => (
                <button key={r.id} type="button" className={`ss-card ${pressed === r.id ? 'on' : ''}`} onClick={() => { setPressed(r.id); setTimeout(() => props.onRoom(r.id), 180); }}>
                  <b className="t-h4-700 g80">{r.name}</b>
                  <span className="ss-sub">{r.dept} · {r.doctor}</span>
                  {r.desc && <span className="t-b2-400 g70">{r.desc}</span>}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ss-items">
            <div style={{ padding: '0 20px' }}>
              <h1 className="t-h3" style={{ padding: '16px 0 20px', margin: 0 }}>진료항목을 선택해 주세요</h1>
              <div className="hd-guide"><b>병원이 직접 입력한 정보예요.</b><span>상세 진료 조건에 따라 실제 가격은 달라질 수 있어요.</span></div>
            </div>
            <div className="hd-chips" style={{ padding: '12px 20px' }}>{cats.map(c => <button key={c} type="button" className={chip === c ? 'on' : ''} onClick={() => setChip(c)}>{c}</button>)}</div>
            <TreatmentList items={props.items.filter(i => chip === '전체' || i.cat === chip)} onItem={props.onItem} />
          </div>
        )}
      </div>
    </div>
  );
}
