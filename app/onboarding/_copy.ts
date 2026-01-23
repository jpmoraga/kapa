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
      title: "Datos personales",
      titlePhoneOnly: "Confirma tu teléfono",
      subtitle: "Completa tu nombre, RUT y teléfono para operar.",
      subtitlePhoneOnly: "Solo necesitamos confirmar tu teléfono para continuar.",
      phoneLabel: "Teléfono",
      phonePlaceholder: "+56 9 1234 5678",
      badge:
        "Siguiente paso: datos bancarios.",
      btnBack: "Volver",
      btnContinue: "Continuar",
    },
  
    bank: {
      title: "Datos bancarios",
      subtitle: "Usaremos estos datos para gestionar abonos y retiros.",
      bankLabel: "Banco",
      bankPlaceholder: "Selecciona un banco",
      typeLabel: "Tipo de cuenta",
      typePlaceholder: "Selecciona tipo de cuenta",
      numberLabel: "Número de cuenta",
      numberPlaceholder: "Ej: 12345678",
      note: "",
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
      intro:
        "Estos términos regulan el uso de la plataforma Kapa21. Al aceptar, confirmas que leíste y entiendes lo siguiente:",
      bullets: [
        "Definiciones: “Kapa21” es la plataforma que administra operaciones de compra/venta y flujos de tesorería del usuario.",
        "Alcance del servicio: Kapa21 facilita la ejecución de operaciones según disponibilidad.",
        "No custodia / terceros: Kapa21 no mantiene custodia directa de tus fondos; utiliza terceros, custodios o exchanges.",
        "Elegibilidad y verificación: podremos solicitar verificación de identidad y otros datos para operar.",
        "Depósitos y retiros: los depósitos en CLP se validan manualmente con comprobantes; pueden ser rechazados si hay inconsistencias.",
        "Riesgos: precios pueden variar, existe volatilidad y riesgos de mercado que asume el usuario.",
        "Disponibilidad: el servicio puede presentar demoras por validaciones, horarios bancarios o dependencias de terceros.",
        "Comisiones: se informan antes de confirmar cada operación.",
        "Privacidad y datos personales: usamos tus datos para operar y cumplir validaciones necesarias.",
        "Limitación de responsabilidad: Kapa21 no responde por pérdidas derivadas de mercado o fallas de terceros, en la medida permitida por ley.",
        "Suspensión/cierre: podremos suspender o cerrar cuentas ante uso indebido, incumplimiento o requerimientos legales.",
        "Ley aplicable y contacto: se rige por la ley chilena. Contacto: contacto@kapa21.cl.",
      ],
    },
  } as const;
