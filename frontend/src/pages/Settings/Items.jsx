import {
  useGetAllSettingsQuery,
  useUpdateSettingMutation,
} from "../../redux/api/Settings/settingsApi";

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
  ] =
    useUpdateSettingMutation();

  const handleToggleSetting = async (
    setting_key,
    currentValue
  ) => {
    const newValue =
      currentValue ? 0 : 1;

    try {
      await updateSetting({
        setting_key,
        setting_value: newValue,
      }).unwrap();
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

  return (
    <>
      <div className="inn-title">
        <h4 className="text-2xl font-bold mb-2">
          Settings
        </h4>

        <p className="text-gray-500 mb-6">
          Turn features on or off based on your requirements
        </p>
      </div>

      {isLoadingSettings ? (
        <p className="text-gray-400 text-sm">
          Loading settings...
        </p>
      ) : (
        <div
          className="space-y-3 mt-2"
          style={{ maxWidth: 600 }}
        >
          {settings?.map(
            (setting) => (
              <div
                key={
                  setting.setting_key
                }
                className="flex items-center justify-between px-4 py-3 rounded-md border"
                style={{
                  borderColor:
                    "#e2e8f0",
                }}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {
                      setting.setting_label
                    }
                  </p>

                  {setting.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {
                        setting.description
                      }
                    </p>
                  )}
                </div>

                <div
                  className={`item-toggle ${
                    setting.setting_value
                      ? "on"
                      : ""
                  }`}
                  onClick={() => {
                    if (
                      isUpdatingSetting
                    )
                      return;

                    handleToggleSetting(
                      setting.setting_key,
                      setting.setting_value
                    );
                  }}
                  style={{
                    opacity:
                      isUpdatingSetting
                        ? 0.6
                        : 1,
                  }}
                />
              </div>
            )
          )}
        </div>
      )}

      <style>{`
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