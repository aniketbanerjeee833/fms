// import {
//   useGetAllSettingsQuery,
//   useUpdateSettingMutation,
// } from "../../redux/api/Settings/settingsApi";
// import { toast } from "react-toastify";
// export default function Items() {
//   const {
//     data: settingsData = [],
//     isLoading: isLoadingSettings,
//   } = useGetAllSettingsQuery();

//   const settings =
//     settingsData?.settings || [];

//   const [
//     updateSetting,
//     {
//       isLoading: isUpdatingSetting,
//     },
//   ] =
//     useUpdateSettingMutation();

//   const handleToggleSetting = async (
//     setting_key,
//     currentValue
//   ) => {
//     const newValue =
//       currentValue ? 0 : 1;

//     try {
//       await updateSetting({
//         setting_key,
//         setting_value: newValue,
//       }).unwrap();
//     } catch (err) {
//       console.error(
//         "Failed to update setting:",
//         err
//       );

//       toast.error(
//         err?.data?.message ||
//           "Failed to update setting"
//       );
//     }
//   };

//   return (
//     <>
//       <div className="inn-title">
//         <h4 className="text-2xl font-bold mb-2">
//           Settings
//         </h4>

//         <p className="text-gray-500 mb-6">
//           Turn features on or off based on your requirements
//         </p>
//       </div>

//       {isLoadingSettings ? (
//         <p className="text-gray-400 text-sm">
//           Loading settings...
//         </p>
//       ) : (
//         <div
//           className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2"
//           style={{ maxWidth: 600 }}
//         >
//           {settings?.map(
//             (setting) => (
//               <div
//                 key={
//                   setting.setting_key
//                 }
//                 className="flex items-center justify-between px-4 py-3 rounded-md border"
//                 style={{
//                   borderColor:
//                     "#e2e8f0",
//                 }}
//               >
//                 <div>
//                   <p className="text-sm font-semibold text-gray-900">
//                     {
//                       setting.setting_label
//                     }
//                   </p>

//                   {setting.description && (
//                     <p className="text-xs text-gray-500 mt-0.5">
//                       {
//                         setting.description
//                       }
//                     </p>
//                   )}
//                 </div>

//                 <div
//                   className={`item-toggle ${
//                     setting.setting_value
//                       ? "on"
//                       : ""
//                   }`}
//                   onClick={() => {
//                     if (
//                       isUpdatingSetting
//                     )
//                       return;

//                     handleToggleSetting(
//                       setting.setting_key,
//                       setting.setting_value
//                     );
//                   }}
//                   style={{
//                     opacity:
//                       isUpdatingSetting
//                         ? 0.6
//                         : 1,
//                   }}
//                 />
//               </div>
//             )
//           )}
//         </div>
//       )}

//       <style>{`
//         .item-toggle {
//           position: relative;
//           width: 44px;
//           height: 24px;
//           background: #cbd5e1;
//           border-radius: 999px;
//           cursor: pointer;
//           transition: background 0.2s;
//           flex-shrink: 0;
//         }

//         .item-toggle.on {
//           background: #4CA1AF;
//         }

//         .item-toggle::after {
//           content: "";
//           position: absolute;
//           top: 3px;
//           left: 3px;
//           width: 18px;
//           height: 18px;
//           background: white;
//           border-radius: 50%;
//           transition: transform 0.2s;
//           box-shadow: 0 1px 3px rgba(0,0,0,.15);
//         }

//         .item-toggle.on::after {
//           transform: translateX(20px);
//         }
//       `}</style>
//     </>
//   );
// }


import { memo } from "react";
import { toast } from "react-toastify";

import {
  useGetAllSettingsQuery,
  useUpdateSettingMutation,
} from "../../redux/api/Settings/settingsApi";

// =========================================================
// SETTING ROW
// =========================================================

const SettingRow = memo(function SettingRow({
  setting,
  isUpdating,
  onToggle,
  disabled = false,
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-md border setting-row"
      style={{
        borderColor: "#e2e8f0",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <div
        style={{
          minWidth: 0,
          paddingRight: 12,
        }}
      >
        <p
          className="text-sm font-semibold"
          style={{
            color: disabled
              ? "#94a3b8"
              : "#111827",
          }}
        >
          {setting.setting_label}
        </p>

        {setting.description && (
          <p
            className="text-xs mt-0.5"
            style={{
              color: disabled
                ? "#a8b3c2"
                : "#6b7280",
            }}
          >
            {setting.description}
          </p>
        )}

        {/* {disabled && (
          <p
            className="text-xs mt-1"
            style={{
              color: "#94a3b8",
            }}
          >
            Enable the required setting first
          </p>
        )} */}
      </div>

      <div
        className={`item-toggle ${
          Number(setting.setting_value) === 1
            ? "on"
            : ""
        }`}
        onClick={() => {
          if (isUpdating || disabled) return;

          onToggle(
            setting.setting_key,
            setting.setting_value
          );
        }}
        style={{
          opacity:
            isUpdating || disabled
              ? 0.5
              : 1,

          cursor:
            isUpdating || disabled
              ? "not-allowed"
              : "pointer",
        }}
      />
    </div>
  );
});

// =========================================================
// ITEMS SETTINGS
// =========================================================

export default function Items() {
  const {
    data: settingsData = [],
    isLoading: isLoadingSettings,
  } = useGetAllSettingsQuery();

  const settings =
    settingsData?.settings || [];

  const [
    updateSetting,
    {
      isLoading: isUpdatingSetting,
    },
  ] = useUpdateSettingMutation();

  // =======================================================
  // FIND SETTING VALUE
  // =======================================================

  const getSettingValue = (settingKey) => {
    return Number(
      settings.find(
        (setting) =>
          setting.setting_key ===
          settingKey
      )?.setting_value
    ) === 1;
  };

  // =======================================================
  // MASTER SETTINGS
  // =======================================================

  const showMRP =
    getSettingValue("show_mrp");

  const barcodeScan =
    getSettingValue("barcode_scan");

  // =======================================================
  // TOGGLE SETTING
  // =======================================================

  const handleToggleSetting = async (
    setting_key,
    currentValue
  ) => {
    const newValue =
      Number(currentValue) === 1
        ? 0
        : 1;

    try {
      await updateSetting({
        setting_key,
        setting_value: newValue,
      }).unwrap();
       toast.success("Setting applied successfully")
    } catch (err) {
      console.error(
        "Failed to update setting:",
        err
      );

      toast.error(
        err?.data?.message ||
          "Failed to update setting"
      );
    }
  };

  // =======================================================
  // LOADING
  // =======================================================

  return (
    <>
      <div className="inn-title">
        <h4 className="text-2xl font-bold mb-2">
          Items Settings
        </h4>

        <p className="text-gray-500 mb-6">
          Turn features on or off based on your
          requirements
        </p>
      </div>

      {isLoadingSettings ? (
        <p className="text-gray-400 text-sm">
          Loading settings...
        </p>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-2"
          // style={{
          //   maxWidth: 600,
          // }}
        >
          {settings.map((setting) => {

            // =================================================
            // CALCULATE SALE PRICE FROM MRP
            // REQUIRES SHOW MRP
            // =================================================

            const isMRPDependent =
              setting.setting_key ===
              "calculate_sale_price_from_mrp_disc";

            // =================================================
            // DIRECT BARCODE SCAN
            // REQUIRES BARCODE SCAN
            // =================================================

            const isDirectBarcodeDependent =
              setting.setting_key ===
              "direct_barcode_scan";

            // =================================================
            // DISABLE DEPENDENT SETTINGS
            // =================================================

            const disabled =
              (isMRPDependent &&
                !showMRP) ||
              (isDirectBarcodeDependent &&
                !barcodeScan);

            return (
              <SettingRow
                key={setting.setting_key}
                setting={setting}
                isUpdating={
                  isUpdatingSetting
                }
                onToggle={
                  handleToggleSetting
                }
                disabled={disabled}
              />
            );
          })}
        </div>
      )}

      <style>{`
        .setting-row {
          min-height: 64px;
          box-sizing: border-box;
          transition:
            opacity 0.2s ease,
            background-color 0.2s ease;
        }

        .item-toggle {
          position: relative;
          width: 44px;
          height: 24px;
          background: #cbd5e1;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .item-toggle.on {
          background: #4CA1AF;
        }

        .item-toggle::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow:
            0 1px 3px rgba(0,0,0,.15);
        }

        .item-toggle.on::after {
          transform: translateX(20px);
        }
      `}</style>
    </>
  );
}