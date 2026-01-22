// app/onboarding/_copy.ts

export const onboardingCopy = {
    ocr: {
      title: "Verificación de identidad",
      subtitle:
        "Sube una foto del carnet. Guardamos la imagen como respaldo y te mostramos los datos detectados para que los confirmes.",
      cardUploadTitle: "Foto del carnet",
      cardUploadHintEmpty:
        "Selecciona una imagen (JPG/PNG). La imagen se guardará como respaldo.",
      scanning: "Leyendo… (OCR)",
      done: "Lectura OK · Revisa y confirma los datos",
      detectedTitle: "Datos detectados",
      detectedHint:
        "En esta etapa la lectura es demo. Después lo conectamos a un proveedor.",
      btnContinue: "Continuar",
      btnBack: "Volver",
      needFile: "Sube una foto para continuar.",
      needScan: "Termina la lectura para continuar.",
    },
  
    personal: {
      title: "Datos faltantes",
      subtitle: "Completa lo mínimo para operar. Guardamos todo lo que pedimos.",
      emailLabel: "Email",
      emailPlaceholder: "tu@email.com",
      phoneLabel: "Teléfono",
      phonePlaceholder: "+56 9 1234 5678",
      addressLabel: "Dirección",
      addressPlaceholder: "Calle 123, depto 45",
      communeLabel: "Comuna",
      communePlaceholder: "Las Condes",
      cityLabel: "Ciudad",
      cityPlaceholder: "Santiago",
      badge:
        "Siguiente paso: datos bancarios. La empresa se crea después desde el Dashboard.",
      btnBack: "Volver",
      btnContinue: "Continuar",
    },
  
    bank: {
      title: "Datos bancarios",
      subtitle: "Pide lo mínimo. Guardamos estos datos para operar retiros y abonos.",
      bankLabel: "Banco",
      bankPlaceholder: "Selecciona un banco",
      typeLabel: "Tipo de cuenta",
      typePlaceholder: "Selecciona tipo de cuenta",
      numberLabel: "Número de cuenta",
      numberPlaceholder: "Ej: 12345678",
      note:
        "Nota: hoy esto es UI y flujo para demo. En el siguiente paso lo guardamos en DB.",
      btnBack: "Volver",
      btnContinue: "Continuar",
      btnContinueDisabled: "Completa banco, tipo y número",
    },
  
    terms: {
      title: "Términos y condiciones",
      subtitle: "Para operar en la plataforma debes aceptar los términos.",
      scrollHint: "Desliza hasta el final para habilitar “Aceptar términos”.",
      btnAccept: "Aceptar términos",
      btnBack: "Volver",
      saving: "Guardando...",
      defaultError: "No se pudo aceptar términos",
      networkError: "Error de red",
      intro: "Para operar en la plataforma debes aceptar los términos.",
      bullets: [
        "Entiendo que esta es una plataforma de prueba/MVP.",
        "Entiendo que los movimientos pueden requerir aprobación.",
        "Acepto el uso de mis datos para fines operacionales.",
      ],
    },
  } as const;