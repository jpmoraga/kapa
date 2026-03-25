"use client";

import { useMemo, useState } from "react";

type TreasuryReviewFormValues = {
  name: string;
  company: string;
  role: string;
  email: string;
  country: string;
  annualRevenue: string;
  industry: string;
  hasRecurringCashFlow: string;
  mainNeeds: string[];
  context: string;
  interestHorizon: string;
  decisionRole: string;
  bitcoinRelationship: string[];
  conversationGoal: string;
  termsAccepted: boolean;
};

type FormErrorKey = keyof TreasuryReviewFormValues | "form";
type FormErrors = Partial<Record<FormErrorKey, string>>;

type Option = {
  value: string;
  label: string;
};

type MultiSelectField = "mainNeeds" | "bitcoinRelationship";

const STEP_TITLES = [
  "Identidad básica",
  "Contexto de empresa",
  "Necesidad principal",
  "Horizonte y decisión",
  "Relación con Bitcoin",
  "Objetivo de la conversación",
] as const;

const MAX_MULTI_SELECT = 2;

const ANNUAL_REVENUE_OPTIONS: Option[] = [
  { value: "under-1m", label: "Menos de USD 1 millón" },
  { value: "1m-3m", label: "Entre USD 1 y 3 millones" },
  { value: "3m-10m", label: "Entre USD 3 y 10 millones" },
  { value: "10m-50m", label: "Entre USD 10 y 50 millones" },
  { value: "over-50m", label: "Más de USD 50 millones" },
  { value: "prefer-discuss", label: "Prefiero conversarlo" },
];

const CASH_FLOW_OPTIONS: Option[] = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "prefiero-conversarlo", label: "Prefiero conversarlo" },
];

const MAIN_NEED_OPTIONS: Option[] = [
  { value: "fortalecer-tesoreria", label: "Fortalecer tesorería y reserva" },
  { value: "mejorar-flexibilidad", label: "Mejorar flexibilidad financiera" },
  { value: "reducir-deuda", label: "Reducir dependencia de deuda o factoring" },
  { value: "planificar-crecimiento", label: "Planificar crecimiento con mejor estructura" },
  { value: "evaluar-bitcoin", label: "Evaluar Bitcoin como infraestructura financiera" },
  { value: "otro", label: "Otro" },
];

const HORIZON_OPTIONS: Option[] = [
  { value: "inmediato", label: "Inmediato" },
  { value: "3-6-meses", label: "3–6 meses" },
  { value: "6-12-meses", label: "6–12 meses" },
  { value: "12-plus-meses", label: "12+ meses" },
];

const DECISION_ROLE_OPTIONS: Option[] = [
  { value: "si-directamente", label: "Sí, directamente" },
  { value: "influyo", label: "Influyo en la decisión" },
  { value: "explorando", label: "Estoy explorando para otra persona" },
];

const BITCOIN_RELATIONSHIP_OPTIONS: Option[] = [
  { value: "tengo-o-tuve", label: "Tengo o he tenido Bitcoin" },
  { value: "vivi-volatilidad", label: "He vivido su volatilidad por al menos 12 meses" },
  { value: "entiendo-valor", label: "Entiendo su propuesta de valor más allá del precio" },
  { value: "aplicacion-empresa", label: "He pensado cómo podría aplicarse en una empresa" },
  { value: "explorar-empresa", label: "Quiero explorar su uso en mi empresa" },
  { value: "recien-empezando", label: "Estoy recién empezando a entenderlo" },
];

const INITIAL_VALUES: TreasuryReviewFormValues = {
  name: "",
  company: "",
  role: "",
  email: "",
  country: "",
  annualRevenue: "",
  industry: "",
  hasRecurringCashFlow: "",
  mainNeeds: [],
  context: "",
  interestHorizon: "",
  decisionRole: "",
  bitcoinRelationship: [],
  conversationGoal: "",
  termsAccepted: false,
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateStep(step: number, values: TreasuryReviewFormValues): FormErrors {
  const errors: FormErrors = {};

  switch (step) {
    case 0:
      if (!values.name.trim()) errors.name = "Ingresa tu nombre.";
      if (!values.company.trim()) errors.company = "Ingresa el nombre de la empresa.";
      if (!values.role.trim()) errors.role = "Ingresa tu cargo.";
      if (!values.email.trim()) {
        errors.email = "Ingresa tu email.";
      } else if (!isValidEmail(values.email)) {
        errors.email = "Ingresa un email válido.";
      }
      if (!values.country.trim()) errors.country = "Ingresa tu país.";
      break;
    case 1:
      if (!values.annualRevenue) {
        errors.annualRevenue = "Selecciona un nivel aproximado de ventas anuales.";
      }
      if (!values.industry.trim()) errors.industry = "Ingresa la industria.";
      if (!values.hasRecurringCashFlow) {
        errors.hasRecurringCashFlow = "Selecciona una opción.";
      }
      break;
    case 2:
      if (values.mainNeeds.length === 0) {
        errors.mainNeeds = "Selecciona al menos una necesidad principal.";
      } else if (values.mainNeeds.length > MAX_MULTI_SELECT) {
        errors.mainNeeds = `Puedes marcar hasta ${MAX_MULTI_SELECT} opciones.`;
      }
      if (!values.context.trim()) {
        errors.context = "Explícanos brevemente el contexto.";
      }
      break;
    case 3:
      if (!values.interestHorizon) errors.interestHorizon = "Selecciona un horizonte.";
      if (!values.decisionRole) errors.decisionRole = "Selecciona tu nivel de participación.";
      break;
    case 4:
      if (values.bitcoinRelationship.length === 0) {
        errors.bitcoinRelationship = "Selecciona al menos una opción.";
      } else if (values.bitcoinRelationship.length > MAX_MULTI_SELECT) {
        errors.bitcoinRelationship = `Puedes marcar hasta ${MAX_MULTI_SELECT} opciones.`;
      }
      break;
    case 5:
      if (!values.conversationGoal.trim()) {
        errors.conversationGoal = "Cuéntanos qué te gustaría obtener.";
      }
      if (!values.termsAccepted) {
        errors.termsAccepted = "Debes aceptar esta condición para postular.";
      }
      break;
    default:
      break;
  }

  return errors;
}

function inputClass(hasError: boolean) {
  return [
    "mt-2 w-full rounded-xl border px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-500",
    "bg-white/5 focus:border-white/20 focus:ring-2 focus:ring-white/15",
    hasError ? "border-red-500/50" : "border-white/10",
  ].join(" ");
}

function optionCardClass(selected: boolean) {
  return [
    "cursor-pointer rounded-2xl border p-4 text-sm transition",
    selected
      ? "border-[#F7931A]/70 bg-[#F7931A]/10 text-white"
      : "border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.06]",
  ].join(" ");
}

function OptionGrid({
  name,
  options,
  value,
  onChange,
  columns = "sm:grid-cols-2",
}: {
  name: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  columns?: string;
}) {
  return (
    <div className={`mt-3 grid gap-3 ${columns}`}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <label
            key={option.value}
            className={optionCardClass(selected)}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={selected}
              onChange={() => onChange(option.value)}
            />
            <span className="font-medium">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function MultiOptionGrid({
  name,
  options,
  values,
  onToggle,
  columns = "sm:grid-cols-2",
}: {
  name: string;
  options: Option[];
  values: string[];
  onToggle: (value: string) => void;
  columns?: string;
}) {
  return (
    <div className={`mt-3 grid gap-3 ${columns}`}>
      {options.map((option) => {
        const selected = values.includes(option.value);

        return (
          <label key={option.value} className={optionCardClass(selected)}>
            <input
              type="checkbox"
              name={name}
              className="sr-only"
              checked={selected}
              onChange={() => onToggle(option.value)}
            />
            <span className="font-medium">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

async function submitTreasuryReview(values: TreasuryReviewFormValues) {
  void values;
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  // TODO: conectar esta postulación a un endpoint cuando exista el flujo backend.
}

export function TreasuryReviewForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<TreasuryReviewFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const progress = useMemo(
    () => ((step + 1) / STEP_TITLES.length) * 100,
    [step]
  );

  const clearError = (key: FormErrorKey) => {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const updateValue = <K extends keyof TreasuryReviewFormValues>(
    key: K,
    value: TreasuryReviewFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    clearError(key);
  };

  const toggleMultiValue = (key: MultiSelectField, value: string) => {
    const selectedValues = values[key];

    if (selectedValues.includes(value)) {
      updateValue(
        key,
        selectedValues.filter((item) => item !== value)
      );
      return;
    }

    if (selectedValues.length >= MAX_MULTI_SELECT) {
      setErrors((current) => ({
        ...current,
        [key]: `Puedes marcar hasta ${MAX_MULTI_SELECT} opciones.`,
      }));
      return;
    }

    updateValue(key, [...selectedValues, value]);
  };

  const goToNextStep = () => {
    const nextErrors = validateStep(step, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setStep((current) => current + 1);
  };

  const goToPreviousStep = () => {
    setErrors({});
    setStep((current) => current - 1);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateStep(step, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      await submitTreasuryReview(values);
      setIsSubmitted(true);
    } catch {
      setErrors({
        form: "No pudimos procesar tu postulación. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div id="postulacion-form" className="k21-card scroll-mt-24 p-6 sm:p-8">
        <div className="inline-flex rounded-full border border-[#F7931A]/20 bg-[#F7931A]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#F7931A]">
          Confirmación
        </div>
        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
          Gracias. Recibimos tu postulación.
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-300">
          Revisaremos el contexto y, si vemos buen encaje, coordinaremos la siguiente
          conversación.
        </p>
      </div>
    );
  }

  return (
    <form
      id="postulacion-form"
      onSubmit={handleSubmit}
      className="k21-card scroll-mt-24 p-6 sm:p-8"
      noValidate
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
            Postulación
          </div>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
            {STEP_TITLES[step]}
          </h3>
        </div>
        <div className="text-sm text-neutral-400">
          Paso {step + 1} de {STEP_TITLES.length}
        </div>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-[#F7931A] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2">
        {STEP_TITLES.map((title, index) => {
          const status =
            index < step ? "bg-[#F7931A] text-black" : index === step ? "bg-white text-black" : "bg-white/5 text-neutral-500";

          return (
            <div
              key={title}
              className={`flex h-9 items-center justify-center rounded-full text-xs font-medium ${status}`}
            >
              <span className="sm:hidden">{index + 1}</span>
              <span className="hidden px-2 text-center sm:block">{index + 1}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 space-y-6">
        {step === 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-white/80">Nombre</label>
                <input
                  type="text"
                  value={values.name}
                  onChange={(event) => updateValue("name", event.target.value)}
                  className={inputClass(Boolean(errors.name))}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  placeholder="Tu nombre"
                />
                {errors.name && <p className="mt-2 text-xs text-red-300">{errors.name}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-white/80">Empresa</label>
                <input
                  type="text"
                  value={values.company}
                  onChange={(event) => updateValue("company", event.target.value)}
                  className={inputClass(Boolean(errors.company))}
                  autoComplete="organization"
                  aria-invalid={Boolean(errors.company)}
                  placeholder="Nombre de la empresa"
                />
                {errors.company && (
                  <p className="mt-2 text-xs text-red-300">{errors.company}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-white/80">Cargo</label>
                <input
                  type="text"
                  value={values.role}
                  onChange={(event) => updateValue("role", event.target.value)}
                  className={inputClass(Boolean(errors.role))}
                  autoComplete="organization-title"
                  aria-invalid={Boolean(errors.role)}
                  placeholder="Tu cargo"
                />
                {errors.role && <p className="mt-2 text-xs text-red-300">{errors.role}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-white/80">Email</label>
                <input
                  type="email"
                  value={values.email}
                  onChange={(event) => updateValue("email", event.target.value)}
                  className={inputClass(Boolean(errors.email))}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  placeholder="nombre@empresa.com"
                />
                {errors.email && <p className="mt-2 text-xs text-red-300">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">País</label>
              <input
                type="text"
                value={values.country}
                onChange={(event) => updateValue("country", event.target.value)}
                className={inputClass(Boolean(errors.country))}
                autoComplete="country-name"
                aria-invalid={Boolean(errors.country)}
                placeholder="País"
              />
              {errors.country && <p className="mt-2 text-xs text-red-300">{errors.country}</p>}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="text-sm font-medium text-white/80">
                ¿Cuál es el nivel aproximado de ventas anuales de la empresa?
              </label>
              <OptionGrid
                name="annual-revenue"
                options={ANNUAL_REVENUE_OPTIONS}
                value={values.annualRevenue}
                onChange={(value) => updateValue("annualRevenue", value)}
              />
              {errors.annualRevenue && (
                <p className="mt-2 text-xs text-red-300">{errors.annualRevenue}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">Industria</label>
              <input
                type="text"
                value={values.industry}
                onChange={(event) => updateValue("industry", event.target.value)}
                className={inputClass(Boolean(errors.industry))}
                aria-invalid={Boolean(errors.industry)}
                placeholder="Ej: manufactura, logística, software, retail"
              />
              {errors.industry && (
                <p className="mt-2 text-xs text-red-300">{errors.industry}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">
                ¿La empresa tiene operación real y flujo de caja recurrente?
              </label>
              <OptionGrid
                name="cash-flow"
                options={CASH_FLOW_OPTIONS}
                value={values.hasRecurringCashFlow}
                onChange={(value) => updateValue("hasRecurringCashFlow", value)}
              />
              {errors.hasRecurringCashFlow && (
                <p className="mt-2 text-xs text-red-300">{errors.hasRecurringCashFlow}</p>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="text-sm font-medium text-white/80">
                ¿Cuál describe mejor la necesidad actual de la empresa?
              </label>
              <p className="mt-1 text-xs text-neutral-500">Puedes marcar hasta 2 opciones.</p>
              <MultiOptionGrid
                name="main-needs"
                options={MAIN_NEED_OPTIONS}
                values={values.mainNeeds}
                onToggle={(value) => toggleMultiValue("mainNeeds", value)}
                columns="sm:grid-cols-2"
              />
              {errors.mainNeeds && (
                <p className="mt-2 text-xs text-red-300">{errors.mainNeeds}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">
                Explícanos brevemente el contexto
              </label>
              <textarea
                value={values.context}
                onChange={(event) => updateValue("context", event.target.value)}
                className={`${inputClass(Boolean(errors.context))} min-h-32 resize-y`}
                aria-invalid={Boolean(errors.context)}
                placeholder="Qué está pasando hoy en la tesorería, el financiamiento o la estructura financiera."
              />
              {errors.context && (
                <p className="mt-2 text-xs text-red-300">{errors.context}</p>
              )}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <label className="text-sm font-medium text-white/80">Horizonte de interés</label>
              <OptionGrid
                name="interest-horizon"
                options={HORIZON_OPTIONS}
                value={values.interestHorizon}
                onChange={(value) => updateValue("interestHorizon", value)}
              />
              {errors.interestHorizon && (
                <p className="mt-2 text-xs text-red-300">{errors.interestHorizon}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">
                ¿Participas en la decisión?
              </label>
              <OptionGrid
                name="decision-role"
                options={DECISION_ROLE_OPTIONS}
                value={values.decisionRole}
                onChange={(value) => updateValue("decisionRole", value)}
              />
              {errors.decisionRole && (
                <p className="mt-2 text-xs text-red-300">{errors.decisionRole}</p>
              )}
            </div>
          </>
        )}

        {step === 4 && (
          <div>
            <label className="text-sm font-medium text-white/80">
              ¿Qué te describe mejor hoy respecto a Bitcoin?
            </label>
            <p className="mt-1 text-xs text-neutral-500">Puedes marcar hasta 2 opciones.</p>
            <MultiOptionGrid
              name="bitcoin-relationship"
              options={BITCOIN_RELATIONSHIP_OPTIONS}
              values={values.bitcoinRelationship}
              onToggle={(value) => toggleMultiValue("bitcoinRelationship", value)}
            />
            {errors.bitcoinRelationship && (
              <p className="mt-2 text-xs text-red-300">{errors.bitcoinRelationship}</p>
            )}
          </div>
        )}

        {step === 5 && (
          <>
            <div>
              <label className="text-sm font-medium text-white/80">
                ¿Qué te gustaría obtener de esta conversación?
              </label>
              <textarea
                value={values.conversationGoal}
                onChange={(event) => updateValue("conversationGoal", event.target.value)}
                className={`${inputClass(Boolean(errors.conversationGoal))} min-h-36 resize-y`}
                aria-invalid={Boolean(errors.conversationGoal)}
                placeholder="Cuéntanos el resultado, claridad o decisión que te gustaría destrabar."
              />
              {errors.conversationGoal && (
                <p className="mt-2 text-xs text-red-300">{errors.conversationGoal}</p>
              )}
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <input
                type="checkbox"
                checked={values.termsAccepted}
                onChange={(event) => updateValue("termsAccepted", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-[#F7931A]"
              />
              <span className="text-sm leading-6 text-neutral-300">
                Acepto que esta postulación no garantiza una reunión y que el proceso busca
                evaluar encaje.
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="text-xs text-red-300">{errors.termsAccepted}</p>
            )}
          </>
        )}
      </div>

      {errors.form && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errors.form}
        </div>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goToPreviousStep}
          disabled={step === 0 || isSubmitting}
          className={step === 0 ? "k21-btn-disabled" : "k21-btn-secondary"}
        >
          Atrás
        </button>

        {step === STEP_TITLES.length - 1 ? (
          <button type="submit" disabled={isSubmitting} className="k21-btn-primary">
            {isSubmitting ? "Enviando..." : "Enviar postulación"}
          </button>
        ) : (
          <button type="button" onClick={goToNextStep} className="k21-btn-primary">
            Siguiente
          </button>
        )}
      </div>
    </form>
  );
}
