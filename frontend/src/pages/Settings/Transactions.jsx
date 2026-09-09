

import { memo } from "react";
import { toast } from "react-toastify";

import {
  useGetAllTransactionsSettingsQuery,
  useUpdateTransactionsSettingMutation,
} from "../../redux/api/Settings/transactionsSettingApi";

// =========================================================
// SETTING ROW
// =========================================================

const SettingRow = memo(function SettingRow({
  setting,
  isUpdating,
  onToggle,
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-md border setting-row mt-2"
      style={{
        borderColor: "#e2e8f0",
      }}
    >
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {setting.setting_label}
        </p>

        {setting.description && (
          <p className="text-xs text-gray-500 mt-0.5">
            {setting.description}
          </p>
        )}
      </div>

      <div
        className={`item-toggle ${
          Number(setting.setting_value) === 1
            ? "on"
            : ""
        }`}
        onClick={() => {
          if (isUpdating) return;

          onToggle(
            setting.setting_key,
            setting.setting_value
          );
        }}
        style={{
          opacity: isUpdating ? 0.6 : 1,
          cursor: isUpdating
            ? "not-allowed"
            : "pointer",
        }}
      />
    </div>
  );
});

// =========================================================
// TRANSACTIONS
// =========================================================

export default function Transactions() {
  // =======================================================
  // GET TRANSACTIONS SETTINGS
  // =======================================================

  const {
    data: settingsData = [],
    isLoading: isLoadingSettings,
  } = useGetAllTransactionsSettingsQuery();

  const settings =
    settingsData?.settings || [];

  // =======================================================
  // UPDATE SETTING
  // =======================================================

  const [
    updateTransactionsSetting,
    {
      isLoading: isUpdatingSetting,
    },
  ] = useUpdateTransactionsSettingMutation();

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
      await updateTransactionsSetting({
        setting_key,
        setting_value: newValue,
      }).unwrap();

      toast.success(
        "Setting applied successfully"
      );
    } catch (err) {
      console.error(
        "Failed to update Transactions setting:",
        err
      );

      toast.error(
        err?.data?.message ||
          "Failed to update setting"
      );
    }
  };

  // =======================================================
  // UI
  // =======================================================

  return (
    <>
      {/* ===================================================
          TITLE
      =================================================== */}

      <div className="inn-title">
        <h4 className="text-2xl font-bold mb-2">
          Transactions Settings
        </h4>

        <p className="text-gray-500 mb-6">
          Configure transaction-related features
          based on your requirements
        </p>
      </div>

      {/* ===================================================
          SETTINGS
      =================================================== */}

      {isLoadingSettings ? (
        <p className="text-gray-400 text-sm">
          Loading settings...
        </p>
      ) : (
        <div
          className="grid grid-cols-1 gap-x-6 mt-2"
        >
          {settings.map((setting) => (
            <SettingRow
              key={setting.setting_key}
              setting={setting}
              isUpdating={
                isUpdatingSetting
              }
              onToggle={
                handleToggleSetting
              }
            />
          ))}
        </div>
      )}

      {/* ===================================================
          TOGGLE STYLE
      =================================================== */}

      <style>{`
        .setting-row {
          min-height: 64px;
          box-sizing: border-box;
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
          box-shadow: 0 1px 3px rgba(0,0,0,.15);
        }

        .item-toggle.on::after {
          transform: translateX(20px);
        }
      `}</style>
    </>
  );
}