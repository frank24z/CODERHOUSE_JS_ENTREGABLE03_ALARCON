$(function() {
    inicializarFormulario();

    mostrarConsultasGuardadas();

    $("#formularioEdad").on("submit", async function(e) {
        e.preventDefault();
        
        const nombre = $("#nombre").val();
        const dia = parseInt($("#dia").val());
        const mes = parseInt($("#mes").val());
        const ano = parseInt($("#ano").val());
        
        if (!esFechaValida(dia, mes, ano) || esFechaFutura(dia, mes, ano)) {
            alert("Fecha no válida. Por favor, vuelve a ingresar."); 
            return;
        }

        try {
            const fechaActual = await obtenerFechaActual(); 
            const fechaNacimiento = new Date(ano, mes - 1, dia);
            const edad = calcularEdad(fechaNacimiento, fechaActual);
            const diasVividos = calcularDiasVividos(fechaNacimiento, fechaActual);
            const diasHastaCumpleanos = calcularDiasHastaCumpleanos(fechaNacimiento, fechaActual);

            mostrarMensaje(`${nombre} tiene ${edad.anos} años, ${edad.meses} meses y ${edad.dias} días. Has vivido ${diasVividos} días en total. Faltan ${diasHastaCumpleanos} días para tu próximo cumpleaños.`);
            
            const persona = { nombre, dia, mes, ano, ...edad, diasVividos, diasHastaCumpleanos };
            agregarPersonaAlListado(persona);
            guardarConsulta(persona);
            mostrarConsultasGuardadas(); 
        } catch (error) {
            alert("Error al obtener la fecha actual. Intenta de nuevo más tarde.");
        }
    });

    $(document).on("click", function(event) {
        if (!$(event.target).closest("#listaPersonas, .tarjetas-laterales, #formularioEdad").length) {
            limpiarTarjetasLaterales();
        }
    });
});

async function inicializarFormulario() {
    console.log("Inicializando formulario...");
    
    const fechaActual = await obtenerFechaActual(); 
    const anoActual = fechaActual.getFullYear(); 

    for (let i = 1; i <= 31; i++) {
        $('#dia').append(`<option value="${i}">${i}</option>`);
    }

    for (let i = anoActual; i >= 1900; i--) {
        $('#ano').append(`<option value="${i}">${i}</option>`);
    }
}

async function obtenerFechaActual() {
    try {
        const response = await fetch('https://worldtimeapi.org/api/timezone/America/Santiago');
        const data = await response.json();
        return new Date(data.datetime);
    } catch (error) {
        console.error("Error al obtener la fecha actual: ", error);
        return new Date(); 
    }
}

function esFechaValida(dia, mes, ano) {
    const date = new Date(ano, mes - 1, dia);
    return date.getFullYear() === ano && date.getMonth() + 1 === mes && date.getDate() === dia;
}

function esFechaFutura(dia, mes, ano) {
    const fechaIngresada = new Date(ano, mes - 1, dia);
    return fechaIngresada > new Date();
}

function calcularEdad(fechaNacimiento, fechaActual) {
    let anos = fechaActual.getFullYear() - fechaNacimiento.getFullYear();
    let meses = fechaActual.getMonth() - fechaNacimiento.getMonth();
    let dias = fechaActual.getDate() - fechaNacimiento.getDate();

    if (dias < 0) {
        meses--;
        const ultimoDiaMesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 0).getDate();
        dias += ultimoDiaMesAnterior;
    }

    if (meses < 0) {
        anos--;
        meses += 12;
    }

    return { anos: anos, meses: meses, dias: dias };
}

function calcularDiasVividos(fechaNacimiento, fechaActual) {
    const diferenciaTiempo = fechaActual - fechaNacimiento;
    return Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24));
}

function calcularDiasHastaCumpleanos(fechaNacimiento, fechaActual) {
    let proximoCumpleanos = new Date(fechaActual.getFullYear(), fechaNacimiento.getMonth(), fechaNacimiento.getDate());

    if (proximoCumpleanos < fechaActual) {
        proximoCumpleanos.setFullYear(proximoCumpleanos.getFullYear() + 1);
    }

    const diferenciaTiempo = proximoCumpleanos - fechaActual;
    return Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));
}

function agregarPersonaAlListado(persona) {
    const listaPersonas = $("#listaPersonas");
    const nombreMes = obtenerNombreMes(persona.mes);
    const li = $("<li></li>").html(`
        <p><strong>${persona.nombre}</strong><br>
        Usted nació el ${persona.dia} de ${nombreMes} de ${persona.ano}<br>
        Tiene ${persona.anos} años</p>
    `);
    const botonEliminar = $("<button></button>").text("Eliminar").addClass("botonEliminar").on("click", function() {
        eliminarConsulta(persona.nombre);
        li.remove();
    });

    li.on("click", function(event) {
        event.stopPropagation();  
        $("#listaPersonas li").removeClass("seleccionada");  
        li.addClass("seleccionada"); 
        mostrarTarjetasLaterales(persona);
    });

    li.append(botonEliminar);
    listaPersonas.append(li);
}

function guardarConsulta(persona) {
    let consultas = obtenerConsultas();
    const nuevaConsulta = `${persona.nombre},${persona.dia}-${persona.mes}-${persona.ano},${persona.anos},${persona.meses},${persona.dias},${persona.diasVividos},${persona.diasHastaCumpleanos}`;
    consultas.push(nuevaConsulta);
    localStorage.setItem('consultas', consultas.join(';'));
}

function obtenerConsultas() {
    const consultas = localStorage.getItem('consultas') || "";
    return consultas ? consultas.split(';') : [];
}

function mostrarConsultasGuardadas() {
    const consultas = obtenerConsultas();
    const listaPersonas = $("#listaPersonas");
    listaPersonas.empty();
    consultas.forEach(consulta => {
        const [nombre, fechaNacimiento, anos, meses, dias, diasVividos, diasHastaCumpleanos] = consulta.split(',');
        const li = $("<li></li>").html(`
            <p><strong>${nombre}</strong><br>
            Usted nació el ${fechaNacimiento}<br>
            Tiene ${anos} años</p>
        `);
        const botonEliminar = $("<button></button>").text("Eliminar").addClass("botonEliminar").on("click", function() {
            eliminarConsulta(nombre);
            li.remove();
        });

        li.on("click", function(event) {
            event.stopPropagation();  
            $("#listaPersonas li").removeClass("seleccionada");
            li.addClass("seleccionada");
            console.log("Tarjeta seleccionada:", nombre); 
            mostrarTarjetasLaterales({ nombre, dia: parseInt(fechaNacimiento.split('-')[0]), mes: parseInt(fechaNacimiento.split('-')[1]), ano: parseInt(fechaNacimiento.split('-')[2]), anos, meses, dias, diasVividos, diasHastaCumpleanos });
        });

        li.append(botonEliminar);
        listaPersonas.append(li);
    });
}

function eliminarConsulta(nombre) {
    let consultas = obtenerConsultas();
    consultas = consultas.filter(consulta => !consulta.startsWith(nombre));
    localStorage.setItem('consultas', consultas.join(';'));
    mostrarConsultasGuardadas(); 
}

function mostrarTarjetasLaterales(persona) {
    limpiarTarjetasLaterales();

    $("#edadExacta").show();
    $("#edadExactaTexto").text(`Tu edad exacta es ${persona.anos} años, ${persona.meses} meses y ${persona.dias} días.`);

    $("#cumpleanos").show();
    $("#cumpleanosTexto").text(`Faltan ${persona.diasHastaCumpleanos} días para tu cumpleaños.`);

    $("#diasVividos").show();
    $("#diasVividosTexto").text(`¡Has vivido ${persona.diasVividos} días exactamente!`);

    $("#horasVividas").show();
    $("#horasVividasTexto").text(`¡Has vivido ${calcularHorasVividas(persona.dia, persona.mes, persona.ano)} horas aproximadas!`);

    $("#diaSemana").show();
    $("#diaSemanaTexto").text(`El día de la semana que naciste es ${calcularDiaSemana(persona.dia, persona.mes, persona.ano)}.`);

    $("#signoZodiaco").show();
    $("#signoZodiacoTexto").text(`Tu horóscopo del signo zodiacal es ${calcularSignoZodiacal(persona.dia, persona.mes)}.`);
}

function limpiarTarjetasLaterales() {
    $(".tarjeta").hide();
}

function obtenerNombreMes(numeroMes) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[numeroMes - 1];
}

function calcularHorasVividas(dia, mes, ano) {
    const nacimiento = new Date(ano, mes - 1, dia);
    const ahora = new Date();
    return Math.floor((ahora - nacimiento) / (1000 * 60 * 60));
}

function calcularDiaSemana(dia, mes, ano) {
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const nacimiento = new Date(ano, mes - 1, dia);
    return diasSemana[nacimiento.getDay()];
}

function calcularSignoZodiacal(dia, mes) {
    const signos = [
        { signo: "Capricornio", inicio: [12, 22], fin: [1, 19] },
        { signo: "Acuario", inicio: [1, 20], fin: [2, 18] },
        { signo: "Piscis", inicio: [2, 19], fin: [3, 20] },
        { signo: "Aries", inicio: [3, 21], fin: [4, 19] },
        { signo: "Tauro", inicio: [4, 20], fin: [5, 20] },
        { signo: "Géminis", inicio: [5, 21], fin: [6, 20] },
        { signo: "Cáncer", inicio: [6, 21], fin: [7, 22] },
        { signo: "Leo", inicio: [7, 23], fin: [8, 22] },
        { signo: "Virgo", inicio: [8, 23], fin: [9, 22] },
        { signo: "Libra", inicio: [9, 23], fin: [10, 22] },
        { signo: "Escorpio", inicio: [10, 23], fin: [11, 21] },
        { signo: "Sagitario", inicio: [11, 22], fin: [12, 21] },
    ];

    const signo = signos.find(s => 
        (mes === s.inicio[0] && dia >= s.inicio[1]) || 
        (mes === s.fin[0] && dia <= s.fin[1])
    );

    return signo ? signo.signo : "Desconocido";
}

function mostrarMensaje(mensaje) {
    alert(mensaje); 
}
