import { useState } from "react";
import { useEffect } from "react";
import { toast } from "react-toastify";

import {
  useAddFinancialYearMutation,
  useGetAllFinancialYearsQuery,
  useUpdateCurrentFinancialYearMutation,
} from "../../redux/api/Settings/settingsApi";

export default function FinancialYear() {
  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [financialYear, setFinancialYear] =
    useState("");

  const [
    addFinancialYear,
    {
      isLoading: isAddingFinancialYear,
    },
  ] =
    useAddFinancialYearMutation();

  const [
    updateCurrentFinancialYear,
  ] =
    useUpdateCurrentFinancialYearMutation();

  const startYear = startDate
    ? new Date(startDate).getFullYear()
    : null;

  const endMinDate = startYear
    ? `${startYear + 1}-01-01`
    : "";

  const { data: allFinancialYear } =
    useGetAllFinancialYearsQuery();

  useEffect(() => {
    if (startDate && endDate) {
      const sYear =
        new Date(startDate).getFullYear();

      const eYear =
        new Date(endDate).getFullYear();

      setFinancialYear(
        `${sYear}-${eYear}`
      );
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !startDate ||
      !endDate ||
      !financialYear
    ) {
      toast.error(
        "Start Date, End Date and Financial Year are required."
      );
      return;
    }

    if (
      new Date(startDate) >
      new Date(endDate)
    ) {
      toast.error(
        "Start Date cannot be greater than End Date"
      );
      return;
    }

    try {
      await addFinancialYear({
        financialYear,
        startDate,
        endDate,
      }).unwrap();

      toast.success(
        "Financial Year Added Successfully"
      );

      setStartDate("");
      setEndDate("");
      setFinancialYear("");
    } catch (err) {
      console.error(
        "Failed to add financial year:",
        err
      );

      toast.error(
        err?.data?.message ||
          "Error adding financial year"
      );
    }
  };

  const handleSetCurrentFinancialYear =
    async (id, fyName) => {
      try {
        await updateCurrentFinancialYear({
          financialYearId: id,
        }).unwrap();

        toast.success(
          `Your Current Financial Year Updated to ${fyName}`
        );
      } catch (err) {
        console.error(err);

        toast.error(
          err?.data?.message ||
            "Update failed"
        );
      }
    };

  return (
    <>
      <div className="inn-title">
        <h4 className="text-2xl font-bold mb-2">
          Financial Year
        </h4>

        <p className="text-gray-500 mb-6">
          Add or Select Financial Year
        </p>
      </div>

      <div className="tab-inn">
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            e.preventDefault()
          }
        >
          <div className="row flex flex-row gap-4">
            <div className="input-field col s6">
              <span className="active">
                Start Date{" "}
                <span className="text-red-500 font-bold text-lg">
                  *
                </span>
              </span>

              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(
                    e.target.value
                  );
                  setEndDate("");
                }}
                className="w-full outline-none border-b-2 text-gray-900"
              />
            </div>

            <div className="input-field col s6">
              <span className="active">
                End Date{" "}
                <span className="text-red-500 font-bold text-lg">
                  *
                </span>
              </span>

              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(
                    e.target.value
                  )
                }
                min={endMinDate}
                disabled={!startDate}
                className="w-full outline-none border-b-2 text-gray-900"
              />
            </div>

            <div className="input-field col s6">
              <span>
                Financial Year
              </span>

              <input
                type="text"
                value={financialYear}
                className="w-full outline-none border-b-2 text-gray-900 mt-2"
                readOnly
              />
            </div>

            <div className="input-field col s6 items-center flex justify-end">
              <button
                type="submit"
                style={{
                  backgroundColor:
                    "#4CA1AF",
                }}
                className="waves-effect waves-light btn-large"
              >
                {isAddingFinancialYear
                  ? "Saving..."
                  : "Save"}
              </button>
            </div>
          </div>
        </form>

        {allFinancialYear?.length >
          0 &&
          allFinancialYear.map(
            (fy, index) => (
              <div
                key={index}
                className="mt-4 ml-4 max-h-[50vh] overflow-y-auto space-y-2 w-[50%]"
              >
                <div
                  className="flex items-center justify-between px-3 py-2 bg-[#f3f2fd]
                  border-l-4 border-[#4CA1AF] border border-gray-300
                  rounded-md text-sm text-[#4CA1AF] font-medium"
                >
                  <input
                    type="checkbox"
                    className="mr-2 cursor-pointer"
                    checked={
                      fy.Current_Financial_Year ===
                      1
                    }
                    onChange={() =>
                      handleSetCurrentFinancialYear(
                        fy.id,
                        fy.Financial_Year
                      )
                    }
                  />

                  <span>
                    {fy.Financial_Year}
                  </span>
                </div>
              </div>
            )
          )}
      </div>
    </>
  );
}