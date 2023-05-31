import IconButton from "src/components/UI/IconButton";
import { IoIosAdd } from "react-icons/io";
import WaterRuntime from "./WaterRuntime";
import { Duration } from "luxon";
import CreateIntervalModal from "./CreateIntervalModal";
import { Fragment, useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import { WeekDays } from "src/domain/WeekDays";
import { groupIntervals } from "src/utils/groupIntervals";
import ScheduleColumn from "./ScheduleColumn";
import Interval from "src/domain/Interval";
import RunWateringModal from "./RunWateringModal";
import { useGet } from "src/hooks/useGet";
import axios, { AxiosError } from "axios";
import IntervalDto from "src/domain/IntervalDto";
import { displayErrorToast, displaySuccessToast } from "src/utils/displayToast";
import { CreateIntervalDto } from "src/domain/CreateIntervalDto";
import { useMemo } from "react";
import UpdateIntervalModal from "./UpdateIntervalModal";

const API_URL = process.env.REACT_APP_API_BASE_URL;

export default function Watering() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  const [intervalModalOpen, setIntervalModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [durationModalOpen, setDurationModalOpen] = useState(false);

  const [intervals, setIntervals] = useState<Interval[]>([]);
  const [toUpdate, setToUpdate] = useState<Interval>(
    new Interval(-1, "00:00:00", "01:00:00", 0)
  );

  const groupedIntervals = useMemo(
    () => groupIntervals(intervals),
    [intervals]
  );

  const runWateringService = async (isOn: boolean, duration: number) => {
    try {
      let url = `${API_URL}/watering-system/toggle`;
      await axios.post(url, {
        state: isOn,
        duration: Duration.fromObject({ minutes: duration }).as("minutes"),
      });
      displaySuccessToast("Manual Watering initiated!");
    } catch (error) {
      const axiosError = error as AxiosError;
      displayErrorToast(axiosError.message);
    }
  };

  const setSchedule = (intervals: IntervalDto[]) => {
    setIntervals(
      intervals.map((dto) => {
        return new Interval(dto.id, dto.startTime, dto.endTime, dto.dayOfWeek);
      })
    );
  };

  const intervalResponse = useGet<IntervalDto[]>(`${API_URL}/schedule`);
  useEffect(() => {
    let mounted = true;
    if (mounted && intervalResponse.data != null) {
      let intervalDtos: IntervalDto[];
      intervalDtos = intervalResponse.data;
      setSchedule(intervalDtos);
    }
    return () => {
      mounted = false;
    };
  }, [intervalResponse.data]);

  if (intervalResponse.error != null) {
    displayErrorToast(intervalResponse.error.message);
  }

  const openUpdateIntervalModal = (updateId: number) => {
    const toUpdate = intervals.find((interval) => interval.id === updateId);
    if (toUpdate === undefined) return;
    setToUpdate(toUpdate);
    setUpdateModalOpen(true);
  };

  const updateInterval = async (dto: IntervalDto) => {
    try {
      let url = `${API_URL}/schedule/${dto.id}`;
      await axios.put(url, dto);

      //New array so that useMemo detects reference change
      const newIntervals = [...intervals];

      const index = newIntervals.findIndex(
        (interval) => interval.id === dto.id
      );

      if (index === -1) return;

      newIntervals[index] = new Interval(
        dto.id,
        dto.startTime,
        dto.endTime,
        dto.dayOfWeek
      );

      setIntervals(newIntervals);
      displaySuccessToast("Interval updated successfully!");
    } catch (error) {
      const axiosError = error as AxiosError;
      displayErrorToast(axiosError.message);
    }
  };

  const deleteInterval = async (id: number) => {
    try {
      let url = `${API_URL}/schedule/${id}`;
      await axios.delete(url);
      setIntervals(intervals.filter((interval) => interval.id !== id));
      displaySuccessToast("Interval deleted successfully!");
    } catch (error) {
      const axiosError = error as AxiosError;
      displayErrorToast(axiosError.message);
    }
  };

  const addInverval = async (newIntervals: CreateIntervalDto[]) => {
    try {
      let url = `${API_URL}/schedule`;
      const result = await axios.post(url, newIntervals);
      const newSchedule = intervals.concat(
        (result.data as IntervalDto[]).map((dto) => {
          return new Interval(
            dto.id,
            dto.startTime,
            dto.endTime,
            dto.dayOfWeek
          );
        })
      );
      setIntervals(newSchedule);
      displaySuccessToast("Intervals added successfully!");
    } catch (error) {
      const axiosError = error as AxiosError;
      displayErrorToast(axiosError.message);
    }
  };
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 640);
    }

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div className="m-3">
        <div className="text-center text-xl my-7 items-center justify-center lg:mb-4 lg:justify-left sm:flex font-bold">
          Watering Schedule
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setIntervalModalOpen(true)}
            data-testid="add-button"
            className="bg-dark hidden sm:block hover:bg-dark-light py-4 px-4 text-white items-center rounded-lg font-semibold"
          >
            Add Watering Time
          </button>
          <button
            data-testid="water-toggle"
            onClick={() => setDurationModalOpen(true)}
          >
            <div className="bg-dark hover:bg-dark-light max-sm:justify-between max-sm:w-full rounded-lg text-white flex items-center py-4 px-4 font-semibold">
              <div className="whitespace-nowrap">Manual Start</div>
            </div>
          </button>
        </div>

        {isMobile ? (
          <Tab.Group>
            <Tab.List className="flex min-w-full scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-300 scrollbar-thumb-rounded-md justify-between flex-shrink-0 gap-4 overflow-x-scroll overflow-y-hidden">
              {WeekDays.map((day) => (
                <Tab key={day} as={Fragment}>
                  {({ selected }) => (
                    <div
                      className={[
                        "font-semibold flex-grow focus:outline-0 cursor-pointer text-center w-14 flex justify-center items-center h-16 my-4 py-4 px-2 flex-shrink-0 rounded-lg",
                        selected
                          ? "bg-dark text-white"
                          : groupedIntervals[day].length > 0
                          ? "bg-accent"
                          : "bg-slate-100",
                      ].join(" ")}
                    >
                      {day.substring(0, 3)}
                    </div>
                  )}
                </Tab>
              ))}
            </Tab.List>
            <div className="font-semibold mt-10 mb-2">Timeline</div>
            <div data-testid="add-button-mobile" className="mt-3">
              <IconButton
                onClick={() => setIntervalModalOpen(true)}
                icon={<IoIosAdd className="text-white w-full h-full" />}
              />
            </div>
            <Tab.Panels className="mt-4">
              {WeekDays.map((day) => (
                <Tab.Panel key={day}>
                  {groupedIntervals[day].map((interval, index) => (
                    <div key={index} className="mt-2">
                      <WaterRuntime
                        onUpdate={openUpdateIntervalModal}
                        onDelete={deleteInterval}
                        interval={interval}
                      />
                    </div>
                  ))}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        ) : (
          <div className="grid gap-3 grid-cols-7">
            {WeekDays.map((day) => (
              <ScheduleColumn
                onUpdate={openUpdateIntervalModal}
                onDelete={deleteInterval}
                key={day}
                day={day}
                intervals={groupedIntervals[day]}
              />
            ))}
          </div>
        )}
      </div>
      <CreateIntervalModal
        data-testid="create-modal"
        onAdd={addInverval}
        open={intervalModalOpen}
        onClose={() => setIntervalModalOpen(false)}
      />
      <UpdateIntervalModal
        toUpdate={toUpdate}
        onUpdate={updateInterval}
        open={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
      />
      <RunWateringModal
        onRun={runWateringService}
        open={durationModalOpen}
        onClose={() => setDurationModalOpen(false)}
      />
    </>
  );
}
