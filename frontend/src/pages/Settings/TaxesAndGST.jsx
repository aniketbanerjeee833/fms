import { memo } from "react";
import { toast } from "react-toastify";
import { useGetAllTaxesAndGSTSettingsQuery, useUpdateTaxesAndGSTSettingMutation } from "../../redux/api/Settings/taxesAndGSTSettingsApi";



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
      className="flex items-center justify-between px-4 py-3 rounded-md border setting-row mt-2"
      style={{
        borderColor: "#e2e8f0",
        opacity: disabled ? 0.55 : 1,
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
          if (isUpdating || disabled) return;

          onToggle(
            setting.setting_key,
            setting.setting_value
          );
        }}
        style={{
          opacity:
            isUpdating || disabled ? 0.6 : 1,
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
// TAXES & GST
// =========================================================

export default function TaxesAndGST() {
  // =======================================================
  // GET TAX / GST SETTINGS
  // =======================================================

  const {
    data: settingsData = [],
    isLoading: isLoadingSettings,
  } = useGetAllTaxesAndGSTSettingsQuery();

  const settings =
    settingsData?.settings || [];

  // =======================================================
  // UPDATE SETTING
  // =======================================================

  const [
    updateTaxesAndGSTSetting,
    {
      isLoading: isUpdatingSetting,
    },
  ] =
    useUpdateTaxesAndGSTSettingMutation();

  // =======================================================
  // GST SETTING
  // =======================================================

  const gstSetting = settings.find(
    (setting) =>
      setting.setting_key === "enable_gst"
  );

  const gstEnabled =
    Number(gstSetting?.setting_value) === 1;

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
      await updateTaxesAndGSTSetting({
        setting_key,
        setting_value: newValue,
      }).unwrap();
      toast.success("Setting applied successfully");
    } catch (err) {
      console.error(
        "Failed to update Taxes/GST setting:",
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
          Taxes & GST Settings
        </h4>

        <p className="text-gray-500 mb-6">
          Turn tax and GST features on or off
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
          className="grid grid-cols-1 sm:grid-cols-1 gap-x-6  mt-2"
          style={{
            //maxWidth: 600,
          }}
        >
          {settings.map((setting) => {
            // HSN/SAC and Place of Supply
            // can only be enabled when GST is ON.
            const isDependentSetting =
              setting.setting_key ===
                "enable_hsn_sac" ||
              setting.setting_key ===
                "enable_place_of_supply";

            const disabled =
              isDependentSetting &&
              !gstEnabled;

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