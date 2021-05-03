import "../style/main.css";

interface Event<K extends string> {
  kind : K;
}

interface Component<T extends object, K extends string, E extends Event<K>> {
  state : T;
  subscribers : { [k in K] : ((e : E) => void)[] };

  handler(root : HTMLElement) : ProxyHandler<T>;
  render(root : HTMLElement) : void;
  addEventSubscriber(k : K, f : (e : E) => void) : void;
}

type DayState = { day : Date, selected : boolean } & object;
type DayEventKinds = "Selected";
type DayEvents = { kind : "Selected", date : Date, selected : boolean };

class DayComponent implements Component<DayState, DayEventKinds, DayEvents> {
    readonly state : DayState;
    subscribers : { [k in DayEventKinds] : ((e : DayEvents) => void)[] } = {
      Selected : []
    };

    constructor(state : DayState, root : HTMLElement) {
      this.state = new Proxy(state, this.handler(root));

      root.onclick = (ev : MouseEvent) => {
        this.state.selected = !this.state.selected;
        this.subscribers["Selected"].forEach((f) => {
          f({ kind : "Selected", date : this.state.day, selected : this.state.selected  });
        });
      }

      this.render(root);
    }

    handler(root : HTMLElement) : ProxyHandler<DayState> {
      var _this = this;
      return {
        get: function(_target : DayState, prop : keyof DayState, receiver : DayState) {
          return _target[prop];
        },
        set: function(obj : DayState, prop : keyof DayState, value : any) {
          if (obj[prop] === value) {
              console.log("early");
              // return early if the value isn't changing to limit operations on the DOM
              return true;
          };

          if (prop == "day" && obj[prop].getDate() == (value as Date).getDate()) {
            (obj[prop] as any) = value;
            // No need to re-render as the day is the same
            return true;
          } else {
            (obj[prop] as any) = value;
            _this.render(root);
          }

          return true;
        }
      };
    }

    render(root : HTMLElement) {
      root.innerText = this.state.day.getDate().toString();
      if (this.state.selected) {
        root.classList.add("bg-blue-200");
      } else {
        root.classList.remove("bg-blue-200");
      }
    };

    addEventSubscriber(k : DayEventKinds, f : (e : DayEvents) => void) {
      this.subscribers[k].push(f);
    }
}

class CalendarComponent implements Component<State, Foo, Event<Foo>> {
  readonly state : State;
  subscribers : { [k in Foo] : ((e : Event<Foo>) => void)[] } = {
    Foo : []
  };

  readonly daysElement : HTMLDivElement = document.createElement("div") as HTMLDivElement;
  readonly dayComponents : DayComponent[] = [];

  constructor(state : State, root : HTMLElement) {
    this.state = new Proxy(state, this.handler(root));

    for (var y = 0; y < 6; y++) {
      var row : HTMLDivElement = document.createElement("div") as HTMLDivElement;
      row.classList.add("flex", "flex-row");
      for (var x = 0; x < 7; x++) {
          var dayElement : HTMLDivElement = document.createElement("div") as HTMLDivElement;
          dayElement.classList.add("p-1", "w-8", "h-8", "text-center")
          dayElement.id = `day-${7*y+x}`
          var dayComponent = new DayComponent({ day: new Date(), selected: false }, dayElement);
          dayComponent.addEventSubscriber("Selected", (e : DayEvents) => {
            if (e.kind == "Selected") {
              this.state.selected[`${e.date.getFullYear()}-${e.date.getMonth()}-${e.date.getDate()}`] = e.selected;
            }
          });
          this.dayComponents.push(dayComponent);
          row.appendChild(dayElement);
      }
      this.daysElement.appendChild(row)
    }

    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][this.state.date.getMonth()];
    root.innerHTML = `
      <div class="flex w-4/12">
        <div class="flex-column">
          <div class="flex flex-row"><button class="flex-none left-button">&lt;</button><div class="flex-1 text-center month">${month}</div><button class="flex-none right-button">&gt;</button></div>
          <div class="days">
          </div>
        </div>
      </div>`;

    var rightButton : HTMLCollectionOf<HTMLButtonElement> = root.getElementsByClassName("right-button") as HTMLCollectionOf<HTMLButtonElement>;
    for (const b of rightButton) {
        b.onclick = (ev) => {
            var d = new Date(this.state.date);
            this.state.date = new Date(new Date(new Date(d.setDate(1)).setMonth(d.getMonth() + 1))); // first day of the next month
            this.setSelectedDates();
        }
    }

    var leftButton : HTMLCollectionOf<HTMLButtonElement> = root.getElementsByClassName("left-button") as HTMLCollectionOf<HTMLButtonElement>;
    for (const b of leftButton) {
        b.onclick = (ev) => {
            var d = new Date(this.state.date);
            this.state.date = new Date(d.setDate(-1));
            this.setSelectedDates();
        }
    }

    var elem : HTMLCollectionOf<HTMLDivElement> = root.getElementsByClassName("days") as HTMLCollectionOf<HTMLDivElement>;
    if (elem.length == 0) {
      console.log("CalendarComponent root element should have been initialized");
    } else {
      if (elem[0].children.length == 0) {
          elem[0].appendChild(this.daysElement);
      }
    }

    this.render(root);
  }

  setSelectedDates() : void {
    this.dayComponents.forEach(c => {
      c.state.selected = this.state.selected[`${c.state.day.getFullYear()}-${c.state.day.getMonth()}-${c.state.day.getDate()}`] || false;
    });
  }

  handler(root : HTMLElement) : ProxyHandler<State> {
    var _this = this;
    return {
      get: function(_target : State, prop : keyof State, receiver : State) {
        return _target[prop];
      },
      set: function(obj : State, prop : keyof State, value : any) {
        if (obj[prop] === value) {
            console.log("early");
            // return early if the value isn't changing to limit operations on the DOM
            return true;
        };

        (obj[prop] as any) = value;

        if (prop != "selected") {
          _this.render(root);
        }

        return true;
      }
    };
  };

  render(root : HTMLElement) : void {
    const firstDay = new Date(new Date(this.state.date).setDate(1));
    const weekday = firstDay.getDay();
    const offset = -1 * weekday + 2;
    const startDate = new Date(firstDay.setDate(offset));
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][this.state.date.getMonth()];

    var d = startDate;
    for (var y = 0; y < 6; y++) {
      for (var x = 0; x < 7; x++) {
          this.dayComponents[7*y+x].state.day = new Date((new Date(startDate)).setDate(startDate.getDate() + 7*y + x));
      }
    }

    var monthElements : HTMLCollectionOf<HTMLDivElement> = root.getElementsByClassName("month") as HTMLCollectionOf<HTMLDivElement>;
    for (const m of monthElements) {
        m.innerText = month;
    }
  };

  addEventSubscriber(k : Foo, f : (e : Event<Foo>) => void) {
      this.subscribers[k].push(f);
  }
}

type Foo = "Foo";
type State = { date: Date, selected : { [d : string] : boolean }} & object;
const target : State = {
  date: new Date(Date.now()),
  selected: {}
};

window.onload = async () => {
  var root : HTMLElement = document.getElementById("root-component") as HTMLElement;
  var p : CalendarComponent = new CalendarComponent(target, root);
}
